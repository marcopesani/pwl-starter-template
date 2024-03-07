const { OPENAI_API_KEY } = require("../../server/config");
const OpenAI = require("openai");

// Crea un'istanza di OpenAI utilizzando la chiave API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Definisce un oggetto JSON di esempio che descrive la struttura dell'email
const sampleJson = {
  subject: "L'oggetto dell'email, da 25 a 75 caratteri",
  title: "Il titolo dell'email, da 25 a 50 caratteri",
  subtitle: "Il sottotitolo dell'email, da 100 a 150 caratteri",
  cta: "Il call to action dell'email, massimo 3 parole",
  body: "Il corpo dell'email, da 100 a 2000 caratteri",
  imagePrompt:
    "Un prompt per generare l'immagine principale dell'email usando DALLE-3. L'immagine dovrebbe essere una foto o un'illustrazione che rappresenta il contenuto dell'email. Il prompt dovrebbe essere lungo 100 a 200 caratteri.",
};

// Funzione asincrona per generare il contenuto dell'email
async function generateEmailContent(brief) {
  // Prepara il prompt per il sistema e l'utente
  const systemPrompt = `Sei un email marketer senior specializzato nella scrittura di testi per le email.
  Generi un formato json con i seguenti campi: ${JSON.stringify(
    sampleJson
  )} basato sul brief fornito.`;
  const userPrompt = `Scrivi i contenuti per un'email seguendo questo brief: ${brief}. Scrivi in italiano, utilizzando tecniche di ottimizzazione della conversione.`;

  // Chiama l'API di OpenAI per generare il completamento
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    model: "gpt-3.5-turbo-0125",
  });

  // Controlla se la risposta è valida e lancia un errore in caso contrario
  if (
    !chatCompletion ||
    !chatCompletion.choices ||
    chatCompletion.choices.length === 0 ||
    !chatCompletion.choices[0].message.content
  ) {
    throw new Error("email_generation_error");
  }

  // Restituisce il contenuto dell'email come oggetto JSON
  return JSON.parse(chatCompletion.choices[0].message.content);
}

// Funzione asincrona per generare l'immagine principale dell'email
async function generateHeroImage(prompt) {
  // Chiama l'API di OpenAI per generare l'immagine
  const imageCompletion = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024",
  });

  // Controlla se la risposta è valida e lancia un errore in caso contrario
  if (
    !imageCompletion ||
    !imageCompletion.data ||
    !imageCompletion.data[0].url
  ) { 
    throw new Error("image_generation_error");
  }

  // Restituisce l'URL dell'immagine generata
  return imageCompletion.data[0].url;
}

// Esporta le funzioni per essere utilizzate in altri file
module.exports = {
  generateEmailContent,
  generateHeroImage,
};
