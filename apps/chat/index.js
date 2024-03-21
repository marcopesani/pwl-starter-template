const express = require("express");
const path = require("path");
const multer = require("multer");
const { OpenAI, toFile } = require("openai");
const { createSession } = require("better-sse");
const { OPENAI_API_KEY, OPENAI_ASSISTANT_ID } = require("../../server/config");
const fs = require("fs");

const upload = multer();
const router = express.Router();
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const runControllers = new Map();
const sessions = new Map();

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

router.get("/stream", async (req, res) => {
  const threadId = req.query.thread_id;

  if (!threadId) {
    return res.status(400).send("Missing thread_id query parameter");
  }

  if (sessions.has(threadId)) {
    return res.status(400).send("Session already exists for this thread");
  }

  if (!sessions.has(threadId)) {
    sessions.set(threadId, await createSession(req, res));
  }

  const session = sessions.get(threadId);
  session.push({ value: "[CONNECTED]" }, "connected");
});

router.post("/message", async (req, res) => {
  const threadId = req.body.thread_id;
  const runController = runControllers.get(threadId);

  if (runController) {
    console.log(`Aborting active run for thread ${threadId}`);
    runControllers.delete(threadId);
  }

  if (!sessions.has(threadId)) {
    return res.status(400).send("No session found for this thread");
  }

  try {
    const message = await openai.beta.threads.messages.create(
      req.body.thread_id,
      {
        role: "user",
        content: req.body.prompt,
        file_ids: req.body.file_ids || [],
      }
    );

    console.log(
      `[${req.body.thread_id}] Sent message: ${JSON.stringify(message)}`
    );

    res.header("Content-Type", "text/plain");

    let isResponseEnded = false;

    const endResponse = () => {
      if (!isResponseEnded) {
        res.end();
        isResponseEnded = true;
      }
    };

    const session = sessions.get(threadId);

    openai.beta.threads.runs
      .createAndStream(req.body.thread_id, {
        assistant_id: OPENAI_ASSISTANT_ID,
      })
      .on("runStepCreated", (step) => {
        session.push(step, "runStepCreated");
        console.log(
          `[${req.body.thread_id}] Created step ${step.id} for run ${step.run_id}`
        );
        runControllers.set(req.body.thread_id, { run: step.run_id });
      })
      .on("end", () => {
        session.push({ value: "[END]" }, "end");
        console.log(`[${req.body.thread_id}] Stream ended, deleting thread`);
        runControllers.delete(req.body.thread_id);
      })
      .on("textDelta", (delta, snapshot) => {
        session.push({ value: snapshot.value }, "textDelta");
        res.write(delta.value);
      })
      .on("textDone", () => {
        session.push({ value: "[TEXT_DONE]" }, "textDone");
        console.log(`[${req.body.thread_id}] Finished text stream`);
        endResponse();
      })
      .on("error", (error) => {
        session.push({ value: "[ERROR]" }, "error");
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

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const file = req.file;

  console.log(
    `[uploader] Uploading file "${file.originalname}" (${Math.round(
      file.size / 1024
    )}kb)`
  );

  try {
    // Convert the received file buffer to a FileLike object
    const fileLikeObject = await toFile(file.buffer, file.originalname, {
      type: file.mimetype,
      lastModified: new Date(file.lastModified).getTime(),
    });

    // Directly uploading the received file to OpenAI
    const response = await openai.files.create({
      file: fileLikeObject,
      purpose: "assistants",
    });

    console.log(
      `[uploader] File "${file.originalname}" uploaded successfully: ${response.id}`
    );

    // Returning the full response from the OpenAI API
    res.json(response);
  } catch (error) {
    console.error("Failed to upload file:", error);
    res.status(500).send("Failed to upload file.");
  }
});

router.post("/remove", async (req, res) => {
  try {
    const response = await openai.files.del(req.body.openai_id);

    console.log(`[uploader] File "${req.body.openai_id}" deleted`);
    res.json(response);
  } catch (error) {
    console.error("Failed to remove file:", error);
    res.status(500).send("Failed to remove file.");
  }
});

module.exports = router;
