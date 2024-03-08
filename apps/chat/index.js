const express = require("express");
const router = express.Router();
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("../../server/config");

// Crea un'istanza di OpenAI utilizzando la chiave API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Rende accessibili i file statici dalla directory 'public'
router.use(express.static(path.join(__dirname, "public")));

router.post("/message", async (req, res) => {
  try {
    console.log("Received request:", req.body);

    const stream = openai.beta.chat.completions.stream({
      model: "gpt-3.5-turbo",
      stream: true,
      messages: [{ role: "user", content: req.body.message || "Hello" }],
    });

    res.header("Content-Type", "text/plain");
    for await (const chunk of stream.toReadableStream()) {
      res.write(chunk);
    }

    res.end();
  } catch (e) {
    console.error(e);
  }
});

module.exports = router;
