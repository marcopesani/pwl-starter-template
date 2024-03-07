const express = require("express");
const router = express.Router();

// Serve the form page
router.get("/", (req, res) => {
  res.sendFile("apps/chat/public/index.html", { root: "." });
});

// Handle form submission
router.post("/message", (req, res) => {
  const formData = req.body;

  // retun the post data as a json response
  res.json(formData);
});

module.exports = router;
