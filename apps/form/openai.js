const { OPENAI_API_KEY } = require("../../server/config");
const OpenAI = require("openai");

// Creare un'istanza di OpenAI usando la chiave API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Definire un oggetto JSON di esempio che descrive la struttura dell'email
const SAMPLE_JSON = {
  subject: "Il soggetto dell'email, da 25 a 75 caratteri",
  title: "Il titolo dell'email, da 25 a 50 caratteri",
  subtitle: "Il sottotitolo dell'email, da 100 a 150 caratteri",
  cta: "La call to action dell'email, massimo 3 parole",
  body: "Il corpo dell'email, da 100 a 2000 caratteri",
  imagePrompt:
    "Un prompt per generare l'immagine principale dell'email usando DALLE-3. L'immagine dovrebbe essere una foto o illustrazione che rappresenta il contenuto dell'email. Il prompt dovrebbe essere lungo da 100 a 200 caratteri.",
};

// Definire il prompt di sistema
const SYSTEM_PROMPT = `Sei un esperto di email marketing specializzato nella scrittura di testi per email.
Generi un formato json con i seguenti campi: ${JSON.stringify(
  SAMPLE_JSON
)} basato sul brief fornito.`;

const getUserPrompt = (brief) => {
  return `Scrivi i contenuti per un'email seguendo questo brief: ${brief}. Scrivi in italiano, utilizzando tecniche di ottimizzazione della conversione.`;
};

// Funzione asincrona per generare i contenuti dell'email
async function generateEmailContent(brief) {
  // Chiamare l'API di OpenAI per generare il completamento
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: getUserPrompt(brief) },
    ],
    response_format: { type: "json_object" },
    model: "gpt-3.5-turbo-0125",
  });

  // Verificare se la risposta è valida e lanciare un errore in caso contrario
  if (
    !chatCompletion ||
    !chatCompletion.choices ||
    chatCompletion.choices.length === 0 ||
    !chatCompletion.choices[0].message.content
  ) {
    throw new Error("errore_generazione_email");
  }

  console.log(chatCompletion.choices[0].message.content);

  // Restituire i contenuti dell'email come un oggetto JSON
  return JSON.parse(chatCompletion.choices[0].message.content);
}

// Funzione asincrona per generare l'immagine principale dell'email
async function generateHeroImage(prompt) {
  // Chiamare l'API di OpenAI per generare l'immagine
  const imageCompletion = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024",
  });

  // Verificare se la risposta è valida e lanciare un errore in caso contrario
  if (
    !imageCompletion ||
    !imageCompletion.data ||
    !imageCompletion.data[0].url
  ) {
    throw new Error("errore_generazione_immagine");
  }

  // Restituire l'URL dell'immagine generata
  return imageCompletion.data[0].url;
}

// Esportare le funzioni per essere utilizzate in altri file
module.exports = {
  generateEmailContent,
  generateHeroImage,
  SYSTEM_PROMPT,
  SAMPLE_JSON,
};
