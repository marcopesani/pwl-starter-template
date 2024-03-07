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
  imagePrompt:
    "A prompt to generate the hero image of the email using DALLE-3. The image should be a photo or an illustration that represents the email content. The prompt should be 100 to 200 characters long.",
};

async function generateEmailContent(brief) {
  const systemPrompt = `You are an email marketer that writes top performing copy for emails.
  You output a json format with the following fields: ${JSON.stringify(
    sampleJson
  )} based on the brief provided.`;
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

async function generateHeroImage(prompt) {
  const imageCompletion = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024",
  });

  if (
    !imageCompletion ||
    !imageCompletion.data ||
    !imageCompletion.data[0].url
  ) { 
    throw new Error("image_generation_error");
  }

  return imageCompletion.data[0].url;
}

module.exports = {
  generateEmailContent,
  generateHeroImage,
};
