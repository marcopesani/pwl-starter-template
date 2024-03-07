const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const upload = multer();
const { generateEmailContent } = require("./openai");

// Serve the form page
router.use(express.static(path.join(__dirname, "public")));

router.post("/create", upload.single("heroImage"), async (req, res) => {
  try {
    const formData = req.body;
    if (!formData.brief) {
      throw new Error("brief_missing");
    }

    const emailContent = await generateEmailContent(formData.brief);

    // Return the post data as a json response
    res.json(emailContent);
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

module.exports = router;
