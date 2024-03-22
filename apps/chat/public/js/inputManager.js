/**
 * Gestisce l'input dell'utente nella chat.
 */
class InputManager {
  /**
   * Costruisce un'istanza di InputManager.
   * @param {Object} callbacks - Callback per gestire gli eventi dell'input.
   */
  constructor(
    callbacks = {
      onStart: () => {}, // Callback chiamato all'avvio dell'input
      onStop: () => {}, // Callback chiamato alla chiusura dell'input
      onFileUpload: () => {}, // Callback chiamato all'upload di un file
      onFileRemove: () => {}, // Callback chiamato alla rimozione di un file
    }
  ) {
    this._state = new ReactiveCore(
      {
        isStreaming: false,
        focused: false,
        message: "",
        files: [],
      },
      () => this.updateUI()
    );

    this.callbacks = callbacks;
    this.setupElements();
    this.attachEventListeners();
    this.updateUI();
  }

  /**
   * Imposta gli elementi del DOM utilizzati dall'InputManager.
   */
  setupElements() {
    this.inputForm = document.getElementById("inputForm");
    this.textarea = document.getElementById("message");
    this.fileInput = document.getElementById("fileInput");
    this.fileButton = document.getElementById("fileButton");
    this.attachmentTemplate = document.getElementById("attachmentTemplate");
    this.attachmentsPreview = document.getElementById("attachmentPreviews");
  }

  /**
   * Aggiunge gli event listeners agli elementi del DOM.
   */
  attachEventListeners() {
    this.inputForm.addEventListener("submit", (e) => this.handleFormSubmit(e)); // Listener per la sottomissione del form
    this.inputForm.addEventListener("input", (e) => this.handleFormChange(e)); // Listener per il cambiamento dell'input
    this.textarea.addEventListener("focus", () => this.handleTextareaFocus()); // Listener per il focus sul textarea
    this.textarea.addEventListener("blur", () => this.handleTextareaBlur()); // Listener per il blur sul textarea
    this.textarea.addEventListener("keydown", (e) =>
      this.handleTextareaKeyDown(e)
    ); // Listener per la pressione di un tasto nel textarea
    this.fileButton.addEventListener("click", () => this.fileInput.click()); // Listener per il click sul pulsante di upload file
    this.fileInput.addEventListener("change", (e) =>
      this.handleFileSelection(e)
    ); // Listener per la selezione di un file
  }

  /**
   * Gestisce l'evento di focus sul textarea.
   */
  handleTextareaFocus() {
    this._state.focused = true;
  }

  /**
   * Gestisce l'evento di blur sul textarea.
   */
  handleTextareaBlur() {
    this._state.focused = false;
  }

  /**
   * Gestisce l'evento di pressione di un tasto nel textarea.
   * @param {Event} e - L'evento di pressione del tasto.
   */
  handleTextareaKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.inputForm.dispatchEvent(new Event("submit"));
    }
  }

  /**
   * Gestisce l'invio del form.
   * @param {Event} e - L'evento di invio del form.
   */
  handleFormSubmit(e) {
    e.preventDefault();
    const message = this.inputForm.message.value.trim();
    if (message || this._state.isStreaming || this.fileInput.files.length > 0) {
      this._state.isStreaming = !this._state.isStreaming;
      if (this._state.isStreaming) {
        const files = this._state.files.map((f) => f.openaiId);
        this.callbacks.onStart(message, files);
        this.inputForm.reset();
        this._state.message = "";
        this._state.files = [];
      } else {
        this.callbacks.onStop();
      }
    }
  }

  /**
   * Gestisce il cambiamento nel textarea.
   * @param {Event} e - L'evento di cambiamento nel textarea.
   */
  handleFormChange(e) {
    this._state.message = e.target.value;
  }

  /**
   * Gestisce la selezione di un file.
   * @param {Event} e - L'evento di selezione del file.
   */
  handleFileSelection(e) {
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    const files = Array.from(e.target.files); // Ottiene tutti i file selezionati
    if (files.length === 0) return; // Esce se non sono stati selezionati file

    files.forEach((file) => {
      if (this._state.files.length >= 10) {
        alert("You cannot upload more than 10 files.");
        return;
      }

      if (file.size > maxSize) {
        alert("The file size should not exceed 50MB.");
        return;
      }
      const id = `id_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .substr(2)}`;
      const fileStateObject = {
        id,
        openaiId: null,
        loading: true,
        error: null,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        file,
      };

      this.callbacks.onFileUpload(id, file); // Aggiustato per inviare un singolo file in un array
      this._state.files = [...this._state.files, fileStateObject];
    });
  }

  /**
   * Gestisce la rimozione di un file.
   * @param {string} id - L'ID del file da rimuovere.
   */
  handleFileRemoval(id) {
    const { openaiId } = this._state.files.find((f) => f.id === id);

    if (!openaiId) {
      alert("You cannot remove a file that is being uploaded.");
      return;
    }
    // Rimuove il file dall'elemento di input file

    this.callbacks.onFileRemove(openaiId);
    this._state.files = this._state.files.filter((f) => f.id !== id);
    this.fileInput.value = null;
    this.fileInput.files = this._state.files
      .filter((f) => f.id !== id)
      .map((f) => f.file);
  }

  /**
   * Aggiorna l'interfaccia utente.
   */
  updateUI() {
    this.updateSubmitButtonState();
    this.updateSubmitButtonIcon();
    this.updateTextarea();
    this.updateAttachmentsPreview();
  }

  /**
   * Aggiorna lo stato del pulsante di invio.
   */
  updateSubmitButtonState() {
    const submitButton = this.inputForm.querySelector("button[type='submit']");
    submitButton.disabled = !(
      this._state.message ||
      this._state.isStreaming ||
      this._state.files.length > 0
    );
  }

  /**
   * Aggiorna l'icona del pulsante di invio.
   */
  updateSubmitButtonIcon() {
    const submitButton = this.inputForm.querySelector("button[type='submit']");
    submitButton.innerHTML = this._state.isStreaming
      ? `<i data-feather="x-square" stroke-width="2" width="22" height="22"></i><span class="sr-only">Ferma</span>`
      : `<i data-feather="arrow-up" stroke-width="2" width="22" height="22"></i><span class="sr-only">Invia</span>`;
    feather.replace();
  }

  /**
   * Aggiorna il textarea in base al numero di righe.
   */
  updateTextarea() {
    const textRows = this._state.message.split("\n").length;
    const maxRows = 10;

    this.textarea.rows = textRows > maxRows ? maxRows : textRows;
  }

  /**
   * Rimuove gli event listeners dagli elementi di anteprima degli allegati.
   */
  removeAttachmentEventListeners() {
    Array.from(this.attachmentsPreview.childNodes).forEach((attachment) => {
      if (attachment.nodeName !== "DIV") return;
      const attachmentRemove = attachment.querySelector("#attachmentRemove");
      attachmentRemove.removeEventListener("click", () => {});
      attachment.removeEventListener("mouseenter", () => {});
      attachment.removeEventListener("mouseleave", () => {});
    });
  }

  /**
   * Aggiorna l'anteprima degli allegati.
   */
  updateAttachmentsPreview() {
    // Rimuove gli event listeners esistenti
    this.removeAttachmentEventListeners();

    // Se ci sono file, mostra il container di anteprima
    this.attachmentsPreview.classList.toggle(
      "hidden",
      this._state.files.length === 0
    );

    // Usa un frammento di documento come doppio buffer.
    const fragment = new DocumentFragment();

    // Svuota il container delle anteprime
    while (this.attachmentsPreview.firstChild) {
      this.attachmentsPreview.removeChild(this.attachmentsPreview.firstChild);
    }

    // Renderizza le anteprime
    this._state.files.forEach((file) => {
      const attachment = this.attachmentTemplate.cloneNode(true);
      const attachmentLoader = attachment.querySelector("#attachmentLoader");
      const attachmentImage = attachment.querySelector("#attachmentImage");
      const attachmentRemove = attachment.querySelector("#attachmentRemove");

      attachment.id = `attachment-${file.name}`;
      attachment.classList.remove("hidden");
      attachmentImage.src = file.url;
      attachmentImage.alt = file.name;
      attachmentImage.title = file.name;
      attachmentLoader.classList.toggle("hidden", !file.loading);

      attachmentRemove.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleFileRemoval(file.id);
      });

      // Mostra il pulsante di rimozione dell'allegato al passaggio del mouse
      attachment.addEventListener("mouseenter", () => {
        attachmentRemove.classList.remove("hidden");
      });

      attachment.addEventListener("mouseleave", () => {
        attachmentRemove.classList.add("hidden");
      });

      fragment.appendChild(attachment);
    });

    this.attachmentsPreview.appendChild(fragment);
  }

  /**
   * Avvia l'upload di un file.
   * @param {string} id - L'ID del file da caricare.
   */
  startUpload(id) {
    this._state.files = this._state.files.map((f) =>
      f.id === id ? { ...f, loading: true } : f
    );
  }

  /**
   * Conclude l'upload di un file.
   * @param {string} id - L'ID del file.
   * @param {string} openaiId - L'ID del file su OpenAI.
   * @param {string} error - Eventuali errori durante l'upload.
   */
  finishUpload(id, openaiId = null, error = null) {
    this._state.files = this._state.files.map((f) =>
      f.id === id ? { ...f, openaiId, loading: false, error } : f
    );
  }
}
