/**
 * Gestisce l'input dell'utente e il flusso di messaggi.
 */
class InputManager {
  /**
   * Costruisce un nuovo gestore di input.
   * @param {Object} callbacks - Gli callback per l'inizio e la fine della trasmissione.
   */
  constructor(callbacks = { onStart: () => {}, onStop: () => {} }) {
    this.callbacks = callbacks;
    this.inputForm = document.getElementById("inputForm");
    this.inputForm.addEventListener("submit", (e) => this.handleFormSubmit(e));
    this.inputForm.addEventListener("input", (e) => this.handleFormChange(e));
    this.updateSubmitButtonState(); // Chiama questo per disabilitare inizialmente il pulsante se necessario
    this.isStreaming = false; // Assicura che isStreaming sia dichiarato
  }

  /**
   * Gestisce l'invio del form.
   * @param {Event} e - L'evento di invio.
   */
  handleFormSubmit(e) {
    e.preventDefault();
    const message = this.inputForm.message.value.trim();
    if (message || this.isStreaming) {
      this.isStreaming = !this.isStreaming;
      if (this.isStreaming) {
        this.callbacks.onStart(message);
        this.inputForm.reset();
      } else {
        this.callbacks.onStop();
      }
      this.updateSubmitButtonIcon();
      this.resetTextareaHeight();
    }
    this.updateSubmitButtonState();
  }

  /**
   * Gestisce il cambiamento del form.
   * @param {Event} e - L'evento di input.
   */
  handleFormChange(e) {
    const textarea = e.target;
    const lines = textarea.value.split("\n").length;
    textarea.rows = lines;
    this.updateSubmitButtonState();
  }

  /**
   * Reimposta l'altezza dell'area di testo.
   */
  resetTextareaHeight() {
    const textarea = this.inputForm.querySelector("textarea");
    if (textarea) {
      textarea.rows = 1;
    }
  }

  /**
   * Aggiorna l'icona del pulsante di invio.
   */
  updateSubmitButtonIcon() {
    const submitButton = this.inputForm.querySelector("button[type='submit']");
    submitButton.innerHTML = this.isStreaming
      ? `<i data-feather="x-square" stroke-width="2" width="22" height="22"></i><span class="sr-only">Ferma</span>`
      : `<i data-feather="arrow-up" stroke-width="2" width="22" height="22"></i><span class="sr-only">Invia</span>`;
    feather.replace();
  }

  /**
   * Aggiorna lo stato del pulsante di invio.
   */
  updateSubmitButtonState() {
    const submitButton = this.inputForm.querySelector("button[type='submit']");
    const message = this.inputForm.message.value.trim();
    submitButton.disabled = !(message || this.isStreaming);
  }
}
