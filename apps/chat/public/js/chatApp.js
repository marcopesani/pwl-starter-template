/**
 * Rappresenta l'applicazione di chat.
 */
class ChatApp {
  /**
   * Costruisce un'istanza di ChatApp.
   * @param {Object} assistant - L'assistente della chat.
   * @param {Object} thread - Il thread della chat.
   */
  constructor(assistant, thread) {
    this.assistant = assistant;
    this.thread = thread;
    this.chatManager = new ChatManager(assistant.id, thread.id);
    this.messagesManager = new MessagesManager();
    this.inputManager = new InputManager({
      onStart: (message) => this.sendMessage(message),
      onStop: () => this.stop(),
    });

    // Imposta gli ascoltatori di eventi
    this.chatManager.on("streamMessage", (message) =>
      this.handleStreamMessage(message)
    );
    this.chatManager.on("streamFinished", () => this.handleStreamFinished());
    this.chatManager.on("streamStopped", () => this.handleStreamFinished());

    // Inizializza le librerie di terze parti
    feather.replace();
  }

  /**
   * Gestisce i messaggi ricevuti dallo stream.
   * @param {string} message - Il messaggio ricevuto.
   */
  handleStreamMessage(message) {
    console.log("Received message:", message);
    this.messagesManager.updateCurrentMessage(message);
  }

  /**
   * Gestisce il completamento dello stream.
   */
  handleStreamFinished() {
    this.inputManager.isStreaming = false;
    this.inputManager.updateSubmitButtonIcon();
  }

  /**
   * Invia un messaggio.
   * @param {string} message - Il messaggio da inviare.
   */
  sendMessage(message) {
    this.messagesManager.appendMessage(message, "You");
    this.messagesManager.appendMessage("", this.assistant.name);
    this.chatManager.sendMessage(message);
  }

  /**
   * Ferma lo stream di messaggi.
   */
  stop() {
    this.chatManager.stop();
  }
}
