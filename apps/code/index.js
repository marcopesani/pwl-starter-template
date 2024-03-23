const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const upload = multer();
const axios = require("axios");
const { generateHtml } = require("./openai");

// Rende accessibili i file statici dalla directory 'public'
router.use(express.static(path.join(__dirname, "public")));

// Gestisce l'invio del form, avviando le funzioni per generare il contenuto dell'email e l'immagine
router.post("/create", upload.single("sketch"), async (req, res) => {
  try {
    const formData = req.body;
    if (!formData.brief) {
      throw new Error("brief_missing");
    }

    const codeContent = await generateHtml(formData.brief);

    // Return the post data as a json response
    res.json({ ...codeContent });
  } catch (error) {
    console.error("Error handling form submission:", error);
    if (error.message === "brief_missing") {
      res.status(400).json({ error: error.message });
    } else if (error.message === "code_generation_error") {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "internal_error" });
    }
  }
});

module.exports = router;
