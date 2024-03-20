const express = require("express");
const path = require("path");
const multer = require("multer");
const { OpenAI, toFile } = require("openai");
const { OPENAI_API_KEY, OPENAI_ASSISTANT_ID } = require("../../server/config");
const fs = require("fs");

const upload = multer();
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
  const threadId = req.body.thread_id;
  const runController = runControllers.get(threadId);

  if (runController) {
    console.log(`Aborting active run for thread ${threadId}`);
    runControllers.delete(threadId);
  }

  try {
    await openai.beta.threads.messages.create(req.body.thread_id, {
      role: "user",
      content: req.body.prompt,
    });

    res.header("Content-Type", "text/plain");

    let isResponseEnded = false;

    const endResponse = () => {
      if (!isResponseEnded) {
        res.end();
        isResponseEnded = true;
      }
    };

    const stream = openai.beta.threads.runs
      .createAndStream(req.body.thread_id, {
        assistant_id: OPENAI_ASSISTANT_ID,
      })
      .on("runStepCreated", (step) => {
        console.log(
          `[${req.body.thread_id}] Created step ${step.id} for run ${step.run_id}`
        );
        runControllers.set(req.body.thread_id, { run: step.run_id });
      })
      .on("end", () => {
        console.log(`[${req.body.thread_id}] Stream ended, deleting thread`);
        runControllers.delete(req.body.thread_id);
      })
      .on("textDelta", (_, snapshot) => {
        if (!isResponseEnded) {
          res.write(snapshot.value);
        }
      })
      .on("textDone", () => {
        console.log(`[${req.body.thread_id}] Finished text stream`);
        endResponse();
      })
      .on("error", (error) => {
        runControllers.delete(req.body.thread_id);
        console.error("Stream error:", error);
        if (!isResponseEnded) {
          if (!res.headersSent) {
            res.status(500).send("Error during streaming");
          }
          endResponse();
        }
      });

    req.on("close", () => {
      runControllers.delete(req.body.thread_id);
    });
  } catch (error) {
    console.error("Error handling the request:", error);
    if (!res.headersSent) {
      res.status(500).send("Request error");
    }
  }
});

router.post("/stop", async (req, res) => {
  const runController = runControllers.get(req.body.thread_id);
  console.log(
    `[${req.body.thread_id}] Requesting run ${runController.run} stop`
  );
  if (runController) {
    const run = await openai.beta.threads.runs.cancel(
      req.body.thread_id,
      runController.run
    );
    console.log(
      `[${req.body.thread_id}] Run ${runController.run} stop requested`
    );
    res.json(run);
  } else {
    res.status(404).send("Stream not found or already ended.");
  }
});

module.exports = router;
