/**
 * Gestisce la logica per la visualizzazione e l'aggiornamento dei messaggi nella chat.
 */
class MessagesManager {
  /**
   * Costruttore della classe MessagesManager.
   */
  constructor() {
    this.messageTemplate = document.getElementById("baseMessage");
    this.messagesContainer = document.getElementById("messagesContainer");
    this.messagesOverflow = document.getElementById("messagesOverflow");
    this.userScrolled = false;
    this.isFirstMessage = true;
    this.lastUpdate = 0;
    this.initializeScrollListener();
  }

  /**
   * Inizializza il listener per l'evento di scroll.
   */
  initializeScrollListener() {
    this.messagesOverflow.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = this.messagesOverflow;
      this.userScrolled = scrollTop < scrollHeight - clientHeight - 10;
    });
  }

  /**
   * Aggiunge un messaggio al contenitore dei messaggi.
   * @param {string} message - Il messaggio da aggiungere.
   * @param {string} role - Il ruolo dell'utente che ha inviato il messaggio.
   */
  appendMessage(message, role) {
    if (this.isFirstMessage) {
      this.messagesContainer.innerHTML = "";
      this.isFirstMessage = false;
    }

    const newMessage = this.messageTemplate.cloneNode(true);
    const messageContent = newMessage.querySelector(".messageContent");
    const messageRole = newMessage.querySelector(".messageRole");

    messageContent.textContent = message;
    messageRole.textContent = role;
    newMessage.style.display = "flex";

    this.messagesContainer.appendChild(newMessage);

    if (!this.userScrolled) {
      this.scrollToBottom();
    }

    this.userScrolled = false;
  }

  /**
   * Scorre fino all'ultimo messaggio.
   */
  scrollToBottom() {
    this.messagesOverflow.scrollTop = this.messagesOverflow.scrollHeight;
  }

  /**
   * Aggiorna il contenuto dell'ultimo messaggio.
   * @param {string} content - Il nuovo contenuto del messaggio.
   */
  updateCurrentMessage(content) {
    if (!this.lastUpdate || performance.now() - this.lastUpdate > 25) {
      this.lastUpdate = performance.now();
      requestAnimationFrame(() => this.performUpdate(content));
    }
  }

  /**
   * Esegue l'aggiornamento del contenuto dell'ultimo messaggio.
   * @param {string} content - Il contenuto del messaggio.
   */
  performUpdate(content) {
    const lastMessage = this.messagesContainer.lastElementChild;
    if (!lastMessage) return;

    const messageContent = lastMessage.querySelector(".messageContent");
    if (!messageContent) return;

    const sanitizedContent = DOMPurify.sanitize(content);
    const parsedContent = marked.parse(sanitizedContent);

    if (messageContent.innerHTML !== parsedContent) {
      messageContent.innerHTML = parsedContent;
      if (!this.userScrolled) {
        this.scrollToBottom();
      }
    }
  }
}
