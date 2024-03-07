const express = require("express");
const { PORT, OPENAI_API_KEY } = require("./config");

// Throw an error if the OpenAI API key is not set
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

// Create an Express application
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static("public"));

// Import routes
const formRoute = require("../apps/form");
const chatRoute = require("../apps/chat");

// Use routes
app.use("/form", formRoute);
app.use("/chat", chatRoute);

// Start the server on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);
});
