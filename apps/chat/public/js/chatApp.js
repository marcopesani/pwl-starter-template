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
      onStart: (message, files = []) => this.sendMessage(message, files),
      onStop: () => this.stop(),
      onFileUpload: (id, file) => this.uploadFile(id, file),
      onFileRemove: (openaiId) => this.chatManager.removeFile(openaiId),
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
    //console.log("Received message:", message);
    this.messagesManager.updateCurrentMessage(message);
  }

  /**
   * Gestisce il completamento dello stream.
   */
  handleStreamFinished() {
    this.inputManager._state.isStreaming = false;
  }

  /**
   * Invia un messaggio.
   * @param {string} message - Il messaggio da inviare.
   */
  sendMessage(message, files = []) {
    this.messagesManager.appendMessage(message, "You");
    this.messagesManager.appendMessage("", this.assistant.name);
    this.chatManager.sendMessage(message, files);
  }

  /**
   * Ferma lo stream di messaggi.
   */
  stop() {
    this.chatManager.stop();
  }

  /**
   * Carica un file.
   * @param {string} id - L'ID del file.
   * @param {File} file - Il file da caricare.
   */
  async uploadFile(id, file) {
    this.inputManager.startUpload(id);

    try {
      const result = await this.chatManager.uploadFile(file);

      if (result.error) {
        throw new Error(result.error);
      }

      this.inputManager.finishUpload(id, result.id);
    } catch (error) {
      console.error("Failed to upload file:", error);
      this.inputManager.failUpload(id, null, error.message);
    }
  }
}
