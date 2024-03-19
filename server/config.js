// load environment variables
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

module.exports = {
  PORT,
  OPENAI_API_KEY,
  OPENAI_ASSISTANT_ID,
};
