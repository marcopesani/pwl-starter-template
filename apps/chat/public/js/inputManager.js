class InputManager {
  constructor(
    callbacks = {
      onStart: () => {},
      onStop: () => {},
      onFileUpload: () => {},
      onFileRemove: () => {},
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

  setupElements() {
    this.inputForm = document.getElementById("inputForm");
    this.textarea = document.getElementById("message");
    this.fileInput = document.getElementById("fileInput");
    this.fileButton = document.getElementById("fileButton");
    this.attachmentTemplate = document.getElementById("attachmentTemplate");
    this.attachmentsPreview = document.getElementById("attachmentPreviews");
  }

  attachEventListeners() {
    this.inputForm.addEventListener("submit", (e) => this.handleFormSubmit(e));
    this.inputForm.addEventListener("input", (e) => this.handleFormChange(e));
    this.textarea.addEventListener("focus", () => this.handleTextareaFocus());
    this.textarea.addEventListener("blur", () => this.handleTextareaBlur());
    this.textarea.addEventListener("keydown", (e) =>
      this.handleTextareaKeyDown(e)
    );
    this.fileButton.addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", (e) =>
      this.handleFileSelection(e)
    );
  }

  handleTextareaFocus() {
    this._state.focused = true;
  }

  handleTextareaBlur() {
    this._state.focused = false;
  }

  handleTextareaKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.inputForm.dispatchEvent(new Event("submit"));
    }
  }

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

  handleFormChange(e) {
    this._state.message = e.target.value;
  }

  handleFileSelection(e) {
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    const files = Array.from(e.target.files); // Get all selected files
    if (files.length === 0) return; // Exit if no files are selected

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

      this.callbacks.onFileUpload(id, file); // Adjusted to send a single file in an array
      this._state.files = [...this._state.files, fileStateObject];
    });
  }

  handleFileRemoval(id) {
    const { openaiId } = this._state.files.find((f) => f.id === id);

    if (!openaiId) {
      alert("You cannot remove a file that is being uploaded.");
      return;
    }
    //remove the file from the file input element

    this.callbacks.onFileRemove(openaiId);
    this._state.files = this._state.files.filter((f) => f.id !== id);
    this.fileInput.value = null;
    this.fileInput.files = this._state.files
      .filter((f) => f.id !== id)
      .map((f) => f.file);
  }

  updateUI() {
    this.updateSubmitButtonState();
    this.updateSubmitButtonIcon();
    this.updateTextarea();
    this.updateAttachmentsPreview();
  }

  updateSubmitButtonState() {
    const submitButton = this.inputForm.querySelector("button[type='submit']");
    submitButton.disabled = !(
      this._state.message ||
      this._state.isStreaming ||
      this._state.files.length > 0
    );
  }

  updateSubmitButtonIcon() {
    const submitButton = this.inputForm.querySelector("button[type='submit']");
    submitButton.innerHTML = this._state.isStreaming
      ? `<i data-feather="x-square" stroke-width="2" width="22" height="22"></i><span class="sr-only">Ferma</span>`
      : `<i data-feather="arrow-up" stroke-width="2" width="22" height="22"></i><span class="sr-only">Invia</span>`;
    feather.replace();
  }

  updateTextarea() {
    const textRows = this._state.message.split("\n").length;
    const maxRows = 10;

    this.textarea.rows = textRows > maxRows ? maxRows : textRows;
  }

  removeAttachmentEventListeners() {
    Array.from(this.attachmentsPreview.childNodes).forEach((attachment) => {
      if (attachment.nodeName !== "DIV") return;
      const attachmentRemove = attachment.querySelector("#attachmentRemove");
      attachmentRemove.removeEventListener("click", () => {});
      attachment.removeEventListener("mouseenter", () => {});
      attachment.removeEventListener("mouseleave", () => {});
    });
  }

  updateAttachmentsPreview() {
    // Remove existing event listeners
    this.removeAttachmentEventListeners();

    // If there are files, show the preview container
    this.attachmentsPreview.classList.toggle(
      "hidden",
      this._state.files.length === 0
    );

    // Use a document fragment as a double buffer.
    const fragment = new DocumentFragment();

    // Clear the previews container
    while (this.attachmentsPreview.firstChild) {
      this.attachmentsPreview.removeChild(this.attachmentsPreview.firstChild);
    }

    // Render the previews
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

      // Show the attachment remove button on hover
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

  startUpload(id) {
    this._state.files = this._state.files.map((f) =>
      f.id === id ? { ...f, loading: true } : f
    );
  }

  finishUpload(id, openaiId = null, error = null) {
    this._state.files = this._state.files.map((f) =>
      f.id === id ? { ...f, openaiId, loading: false, error } : f
    );
  }
}
