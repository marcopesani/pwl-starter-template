const { OPENAI_API_KEY } = require("../../server/config");
const OpenAI = require("openai");

// Creare un'istanza di OpenAI usando la chiave API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Definire un oggetto JSON di esempio che descrive la struttura dell'email
const SAMPLE_JSON = {
  challenge: "Descrizione dell'obiettivo ricevuto",
  chain_of_thought:
    "Descrizione della catena di pensiero che applicherai alla generazione del codice",
  html_snippet: "Il codice HTML generato",
};

// Definire il prompt di sistema
const SYSTEM_PROMPT = `Sei uno sviluppatore specializzato in HTML5 semantico e CSS. Il tuo outupt è una porzione di codice HMTL5 semanticamente corretto ed accessibile che utilizza ESCLUSIVAMENTE Tailwind CSS per gli stili. Il codice generato deve essere basato sul brief fornito e l'output è un oggetto JSON con i seguenti campi: ${JSON.stringify(
  SAMPLE_JSON
)}.`;

const getUserPrompt = (brief) => {
  return `Genera codice HTML seguendo questo brief: ${brief}. Non c'è bisogno di generare l'intero documento HTML, solo la parte che risolve il problema specificato. Utilizza ESCLUSIVAMENTE Tailwind CSS per gli stili.`;
};

// Funzione asincrona per generare i contenuti dell'email
async function generateHtml(brief) {
  // Chiamare l'API di OpenAI per generare il completamento
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: getUserPrompt(brief) },
    ],
    response_format: { type: "json_object" },
    model: "gpt-4-turbo-preview",
  });

  // Verificare se la risposta è valida e lanciare un errore in caso contrario
  if (
    !chatCompletion ||
    !chatCompletion.choices ||
    chatCompletion.choices.length === 0 ||
    !chatCompletion.choices[0].message.content
  ) {
    throw new Error("code_generation_error");
  }

  // Restituire i contenuti dell'email come un oggetto JSON
  return JSON.parse(chatCompletion.choices[0].message.content);
}

// Esportare le funzioni per essere utilizzate in altri file
module.exports = {
  generateHtml,
  SYSTEM_PROMPT,
  SAMPLE_JSON,
};
