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
   */
  async sendMessage(prompt) {
    const response = await fetch("/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        thread_id: this.threadId,
      }),
    });

    if (response.body) {
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      let done, value;
      while (true) {
        ({ done, value } = await reader.read());
        if (done) {
          this.emit("streamFinished");
          break;
        }
        this.emit("streamMessage", value);
      }
    }
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

    if (response.ok) {
      this.emit("streamStopped");
    }

    return response.ok;
  }
}