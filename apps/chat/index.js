const express = require("express");
const path = require("path");
const { OpenAI } = require("openai");
const { OPENAI_API_KEY, OPENAI_ASSISTANT_ID } = require("../../server/config");
const fs = require("fs");

const router = express.Router();
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const runControllers = new Map();

router.use((req, res, next) => {
  if (req.path === "/" || req.path === "/index.html") {
    const index = path.join(__dirname, "public", "index.html");
    fs.readFile(index, "utf8", async (err, data) => {
      const assistant = await openai.beta.assistants.retrieve(
        OPENAI_ASSISTANT_ID
      );
      const thread = await openai.beta.threads.create();
      const result = data
        .replace(
          /%%DATA_OBJECT%%/g,
          JSON.stringify({ assistant, thread }).replace(/"/g, '\\"') || "{}"
        )
        .replace(/%%ASSISTANT_NAME%%/g, assistant.name || "Assistant");
      res.send(result);
    });
  } else {
    express.static(path.join(__dirname, "public"))(req, res, next);
  }
});

router.post("/message", async (req, res) => {
  const controller = new AbortController();
  const { signal } = controller;

  signal.addEventListener("abort", () => {
    console.log("Request aborted");
    // Perform any necessary cleanup here
    runControllers.delete(req.body.thread_id);
    if (!res.headersSent) {
      res.status(503).send("Request aborted by the client");
    }
  });

  try {
    await openai.beta.threads.messages
      .create(
        req.body.thread_id,
        {
          role: "user",
          content: req.body.prompt,
        },
        { signal }
      )
      .catch((error) => {
        // Handle promise rejection
        console.error("Failed to create message:", error);
        throw error; // Rethrow to be caught by outer try-catch
      });

    res.header("Content-Type", "text/plain");

    let isResponseEnded = false;

    const endResponse = () => {
      if (!isResponseEnded) {
        res.end();
        isResponseEnded = true;
      }
    };

    const run = openai.beta.threads.runs
      .createAndStream(
        req.body.thread_id,
        {
          assistant_id: OPENAI_ASSISTANT_ID,
        },
        { signal }
      )
      .on("textDelta", (textDelta, snapshot) => {
        if (!isResponseEnded) {
          res.write(snapshot.value);
        }
      })
      .on("textDone", () => {
        endResponse();
        runControllers.delete(req.body.thread_id);
      })
      .on("error", (error) => {
        console.error("Stream error:", error);
        if (!isResponseEnded) {
          if (!res.headersSent) {
            res.status(500).send("Error during streaming");
          }
          endResponse();
        }
      });

    runControllers.set(req.body.thread_id, { run, controller });

    req.on("close", () => {
      controller.abort();
    });
  } catch (error) {
    console.error("Error handling the request:", error);
    if (!res.headersSent) {
      res
        .status(
          error.name === "AbortError" || error.name === "APIUserAbortError"
            ? 503
            : 500
        )
        .send("Request error");
    }
  }
});

// Global handler for unhandled promise rejections, specifically handling APIUserAbortError
process.on("unhandledRejection", (reason, promise) => {
  if (reason.name === "APIUserAbortError") {
    console.error(
      "APIUserAbortError detected. Promise:",
      promise,
      "Reason:",
      reason.message
    );
    // Handle APIUserAbortError specifically, e.g., logging or cleanup tasks
  } else {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // General handling for other types of unhandled rejections
  }
});

router.post("/stop", async (req, res) => {
  const runController = runControllers.get(req.body.thread_id);
  if (runController) {
    runController.controller.abort(); // Access the `controller` property and call `abort`
    runControllers.delete(req.body.thread_id);
    res.json({ message: "Stream aborted successfully" });
  } else {
    res.status(404).send("Stream not found or already ended.");
  }
});

module.exports = router;
