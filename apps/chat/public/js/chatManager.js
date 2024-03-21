/**
 * Gestisce la comunicazione chat, inclusi l'invio di messaggi e la gestione degli eventi.
 */
class ChatManager {
  /**
   * Inizializza una nuova istanza di ChatManager.
   * @param {string} assistantId - L'ID dell'assistente virtuale.
   * @param {string} threadId - L'ID del thread di chat corrente.
   */
  constructor(assistantId, threadId) {
    this.events = new Map();
    this.assistantId = assistantId;
    this.threadId = threadId;
    this.sse = new EventSource(`/chat/stream?thread_id=${threadId}`);
    this.sse.addEventListener("textDelta", (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit("streamMessage", data.value);
      } catch (error) {
        console.error("Failed to parse stream message", error);
      }
    });
    this.sse.addEventListener("end", () => {
      this.emit("streamFinished");
    });
  }

  /**
   * Registra un listener per un evento specifico.
   * @param {string} event - Il nome dell'evento.
   * @param {Function} listener - La funzione da chiamare quando l'evento si verifica.
   */
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
  }

  /**
   * Emette un evento, invocando tutti i listener registrati per quell'evento.
   * @param {string} event - Il nome dell'evento.
   * @param {...any} args - Gli argomenti da passare ai listener dell'evento.
   */
  emit(event, ...args) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        listener(...args);
      });
    }
  }

  /**
   * Invia un messaggio al server e gestisce la risposta.
   * @param {string} prompt - Il messaggio da inviare.
   * @param {string[]} fileIds - Gli ID dei file da inviare.
   */
  async sendMessage(prompt, fileIds) {
    console.log("Sending message:", { prompt, fileIds });
    const response = await fetch("/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        thread_id: this.threadId,
        file_ids: fileIds || [],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return await response.text();
  }

  /**
   * Invia una richiesta per fermare il flusso di messaggi.
   */
  async stop() {
    const response = await fetch("/chat/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thread_id: this.threadId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to stop stream");
    }

    return await response.json();
  }

  /**
   * Carica un file e restituisce l'oggetto File caricato.
   * @param {File} file - Il file da caricare.
   * @returns {Promise<File>} - Il file caricato.
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/chat/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      return response.json();
    } else {
      throw new Error("Failed to upload file");
    }
  }

  /**
   * Elimina un file caricato.
   * @param {string} openaiId - L'ID OpenAI del file da eliminare.
   */
  async removeFile(openaiId) {
    const response = await fetch("/chat/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        openai_id: openaiId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to remove file");
    }

    return await response.json();
  }
}
