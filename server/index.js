const express = require("express");
const { PORT } = require("./config");

// Create an Express application
const app = express();

// Define a static file server. Change to "public/form" to serve the form app
app.use(express.static("public/chat"));

// Define a route handler for the root of the site
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);
});
