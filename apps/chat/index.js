const express = require("express");
const path = require("path");
const { OpenAI } = require("openai");
const { OPENAI_API_KEY, OPENAI_ASSISTANT_ID } = require("../../server/config");
const fs = require("fs");

const router = express.Router();
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Store run controllers in a map with thread_id as key
const runControllers = new Map();

router.use((req, res, next) => {
  if (req.path === "/" || req.path === "/index.html") {
    const index = path.join(__dirname, "public", "index.html");
    fs.readFile(index, "utf8", async (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error reading index file.");
      }
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
  try {
    if (!req.body.prompt) {
      throw new Error("prompt_missing");
    }

    if (!req.body.thread_id) {
      throw new Error("thread_id_missing");
    }

    await openai.beta.threads.messages.create(req.body.thread_id, {
      role: "user",
      content: req.body.prompt,
    });

    res.header("Content-Type", "text/plain");

    const run = openai.beta.threads.runs
      .createAndStream(req.body.thread_id, {
        assistant_id: OPENAI_ASSISTANT_ID,
      })
      .on("textDelta", (textDelta, snapshot) => {
        console.log("Text delta:", { textDelta, snapshot });
        res.write(snapshot.value);
      })
      .on("textDone", (textDelta, snapshot) => {
        console.log("Text done:", { textDelta, snapshot });
        runControllers.delete(req.body.thread_id);
        res.end();
      })
      .on("error", (error) => {
        if (error.name === "AbortError" || error instanceof APIUserAbortError) {
          console.log("Stream aborted by the user or programmatically.");
          res.json({ message: "Operation was cancelled successfully." });
        } else {
          console.error("Stream error:", error);
          res.status(500).send("An error occurred.");
        }
        runControllers.delete(req.body.thread_id);
        res.end();
      });

    runControllers.set(req.body.thread_id, run.controller);
  } catch (e) {
    console.error(e);
    res.status(500).send("An error occurred.");
  }
});

router.post("/stop", async (req, res) => {
  try {
    if (!req.body.thread_id) {
      throw new Error("thread_id_missing");
    }

    const controller = runControllers.get(req.body.thread_id);
    if (controller) {
      controller.abort();
      runControllers.delete(req.body.thread_id);
      res.json({ message: "Stream aborted successfully" });
    } else {
      // If no controller is found, it means there's nothing to abort.
      // You can decide to either send a different message or handle it as you see fit.
      res.status(404).send("Stream not found or already ended.");
    }
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to abort the stream.");
  }
});

module.exports = router;
