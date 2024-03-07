// load environment variables
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = process.env.OPENAI_API_URL;

module.exports = {
  PORT,
  OPENAI_API_KEY,
  OPENAI_API_URL,
};
