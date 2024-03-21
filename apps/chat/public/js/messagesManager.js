class MessagesManager {
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

  initializeScrollListener() {
    this.messagesOverflow.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = this.messagesOverflow;
      this._state.userScrolled = scrollTop < scrollHeight - clientHeight - 10;
    });
  }

  appendMessage(message, role) {
    const newMessage = { content: message, role };
    this._state.messages.push(newMessage);

    if (!this._state.userScrolled) {
      this.scrollToBottom();
    }
    this._state.userScrolled = false;
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      if (this.messagesOverflow) {
        this.messagesOverflow.scrollTop = this.messagesOverflow.scrollHeight;
      }
    });
  }

  updateCurrentMessage(content) {
    if (!this.lastUpdate || performance.now() - this.lastUpdate > 25) {
      this.lastUpdate = performance.now();
      const lastMessageIndex = this._state.messages.length - 1;
      if (lastMessageIndex >= 0) {
        this._state.messages[lastMessageIndex].content = content;
      }
    }
  }

  renderMessages() {
    // Use a document fragment as a double buffer.
    const fragment = new DocumentFragment();

    // Clear messages if it's the first message to avoid flickering.
    if (this._state.isFirstMessage) {
      while (this.messagesContainer.firstChild) {
        this.messagesContainer.removeChild(this.messagesContainer.firstChild);
      }
      this._state.isFirstMessage = false;
    }

    this._state.messages.forEach(({ content, role }) => {
      if (!this.messageTemplate) {
        console.error("Base message element not found.");
        return;
      }
      // Clone the base message element.
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

    // Replace the messages container content with the fragment in one operation.
    this.messagesContainer.replaceChildren(fragment);

    if (!this._state.userScrolled) {
      this.scrollToBottom();
    }
  }
}
