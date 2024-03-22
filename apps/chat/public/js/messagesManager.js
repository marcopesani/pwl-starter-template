/**
 * Gestisce la gestione dei messaggi nella chat.
 */
class MessagesManager {
  /**
   * Costruisce un'istanza di MessagesManager.
   */
  constructor() {
    this._state = new ReactiveCore(
      {
        messages: [],
        userScrolled: false,
        isFirstMessage: true,
      },
      () => this.renderMessages()
    );
    this.messageTemplate = document.getElementById("baseMessage");
    this.messagesContainer = document.getElementById("messagesContainer");
    this.messagesOverflow = document.getElementById("messagesOverflow");
    this.lastUpdate = 0;

    if (this.messagesOverflow) {
      this.initializeScrollListener();
    }
  }

  /**
   * Inizializza un listener per lo scroll.
   */
  initializeScrollListener() {
    this.messagesOverflow.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = this.messagesOverflow;
      this._state.userScrolled = scrollTop < scrollHeight - clientHeight - 10;
    });
  }

  /**
   * Aggiunge un messaggio alla lista dei messaggi.
   * @param {string} message - Il messaggio da aggiungere.
   * @param {string} role - Il ruolo associato al messaggio.
   */
  appendMessage(message, role) {
    const newMessage = { content: message, role };
    this._state.messages.push(newMessage);

    if (!this._state.userScrolled) {
      this.scrollToBottom();
    }
    this._state.userScrolled = false;
  }

  /**
   * Scorre fino in fondo alla lista dei messaggi.
   */
  scrollToBottom() {
    requestAnimationFrame(() => {
      if (this.messagesOverflow) {
        this.messagesOverflow.scrollTop = this.messagesOverflow.scrollHeight;
      }
    });
  }

  /**
   * Aggiorna il messaggio corrente.
   * @param {string} content - Il contenuto del messaggio da aggiornare.
   */
  updateCurrentMessage(content) {
    if (!this.lastUpdate || performance.now() - this.lastUpdate > 25) {
      this.lastUpdate = performance.now();
      const lastMessageIndex = this._state.messages.length - 1;
      if (lastMessageIndex >= 0) {
        this._state.messages[lastMessageIndex].content = content;
      }
    }
  }

  /**
   * Renderizza i messaggi nella chat.
   */
  renderMessages() {
    // Utilizza un frammento di documento come doppio buffer.
    const fragment = new DocumentFragment();

    // Cancella i messaggi se è il primo messaggio per evitare sfarfallio.
    if (this._state.isFirstMessage) {
      while (this.messagesContainer.firstChild) {
        this.messagesContainer.removeChild(this.messagesContainer.firstChild);
      }
      this._state.isFirstMessage = false;
    }

    this._state.messages.forEach(({ content, role }) => {
      if (!this.messageTemplate) {
        console.error("Elemento del messaggio base non trovato.");
        return;
      }
      // Clona l'elemento del messaggio base.
      const newMessage = this.messageTemplate.cloneNode(true);
      const messageContent = newMessage.querySelector(".messageContent");
      const messageRole = newMessage.querySelector(".messageRole");
      const messageAvatar = newMessage.querySelector(".messageAvatar");

      if (messageContent && messageRole) {
        const escapedContent = content
          .replace(/\"/g, '"')
          .replace(/\/\n/, "\n");
        const sanitizedContent = DOMPurify.sanitize(escapedContent);
        const parsedContent = marked.parse(sanitizedContent);
        messageContent.innerHTML = parsedContent;
        messageRole.textContent = role;
        messageAvatar.src = `https://gravatar.com/avatar/${role}?s=100&d=retro&r=x`;
        newMessage.classList.remove("hidden");
        fragment.appendChild(newMessage);
      }
    });

    // Sostituisci il contenuto del contenitore dei messaggi con il frammento in un'unica operazione.
    this.messagesContainer.replaceChildren(fragment);

    if (!this._state.userScrolled) {
      this.scrollToBottom();
    }
  }
}
