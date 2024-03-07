const { OPENAI_API_KEY } = require("../../server/config");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // This is the default and can be omitted
});

const sampleJson = {
  subject: "The subject of the email, from 25 to 75 characters",
  title: "The title of the email, from 25 to 75 characters",
  subtitle: "The subtitle of the email, from 100 to 150 characters",
  cta: "The call to action of the email, max 3 words",
  body: "The body of the email, from 100 to 2000 characters",
};

async function generateEmailContent(brief) {
  const systemPrompt = `You are an email marketer that writes top performing copy for emails.
  You output a json format with the following fields: ${JSON.stringify(sampleJson)} based on the brief provided.`;
  const userPrompt = `Write an email subject and body for the following brief: ${brief}`;

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    model: "gpt-3.5-turbo-0125",
  });

  if (
    !chatCompletion ||
    !chatCompletion.choices ||
    chatCompletion.choices.length === 0 ||
    !chatCompletion.choices[0].message.content
  ) {
    throw new Error("email_generation_error");
  }

  return JSON.parse(chatCompletion.choices[0].message.content);
}

module.exports = {
  generateEmailContent,
};
