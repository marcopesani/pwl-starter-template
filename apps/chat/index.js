const express = require("express");
const router = express.Router();
const path = require("path");
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require("../../server/config");

const memory = {};

// Crea un'istanza di OpenAI utilizzando la chiave API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Rende accessibili i file statici dalla directory 'public'
router.use(express.static(path.join(__dirname, "public")));

router.post("/message", async (req, res) => {
  try {
    if (!req.body.prompt) {
      throw new Error("prompt_missing");
    }

    if (!req.body.session) {
      throw new Error("session_missing");
    }

    // Inizializza la memoria per la sessione
    if (!memory[req.body.session]) {
      memory[req.body.session] = [];
    }

    // Aggiunge il messaggio dell'utente alla memoria
    memory[req.body.session].push({ role: "user", content: req.body.prompt });

    const stream = openai.beta.chat.completions.stream({
      model: "gpt-3.5-turbo-0125",
      stream: true,
      messages: memory[req.body.session],
    });

    res.header("Content-Type", "text/plain");
    let answer = "";

    for await (const chunk of stream.toReadableStream()) {
      res.write(chunk);
      let chunkJson = JSON.parse(new TextDecoder().decode(chunk));
      if (chunkJson.choices[0].finish_reason !== "stop") {
        answer += chunkJson.choices[0].delta.content || "";
      }
    }
    
    // Aggiunge il messaggio dell'assistente alla memoria
    memory[req.body.session].push({
      role: "assistant",
      content: answer
    });

    // Restituisce la risposta
    res.end();
  } catch (e) {
    console.error(e);
  }
});

module.exports = router;
