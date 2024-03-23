const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const upload = multer();
const axios = require("axios");
const { generateEmailContent, generateHeroImage } = require("./openai");

// Rende accessibili i file statici dalla directory 'public'
router.use(express.static(path.join(__dirname, "public")));

// Gestisce l'invio del form, avviando le funzioni per generare il contenuto dell'email e l'immagine
router.post("/create", upload.single("heroImage"), async (req, res) => {
  try {
    const formData = req.body;
    if (!formData.brief) {
      throw new Error("brief_missing");
    }

    const emailContent = await generateEmailContent(formData.brief);

    // Return the post data as a json response
    res.json({ ...emailContent });
  } catch (error) {
    console.error("Error handling form submission:", error);
    if (error.message === "brief_missing") {
      res.status(400).json({ error: error.message });
    } else if (error.message === "email_generation_error") {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "internal_error" });
    }
  }
});

// Nuovo endpoint per generare un'immagine PNG a partire da un prompt
router.get("/generate-image", async (req, res) => {
  try {
    const prompt = req.query.prompt;
    if (!prompt) {
      throw new Error("prompt_missing");
    }

    const imageUrl = await generateHeroImage(prompt);

    // Scarica l'immagine PNG e restituiscila come risposta
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");
    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error("Error generating image:", error);
    if (error.message === "prompt_missing") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "image_generation_error" });
    }
  }
});

module.exports = router;
