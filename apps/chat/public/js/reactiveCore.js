/**
 * Rappresenta il core reattivo.
 */
class ReactiveCore {
  /**
   * Costruisce un'istanza di ReactiveCore.
   * @param {Object} target - L'oggetto target da rendere reattivo.
   * @param {Function} callback - La funzione di callback da eseguire.
   */
  constructor(target, callback) {
    this.originalObject = target;
    this.callback = callback;
    this.changes = new Set(); // Memorizza i percorsi delle proprietà modificate
    this.isBatching = false;

    return this._createProxy(target);
  }

  /**
   * Crea un proxy per l'oggetto target.
   * @param {Object} target - L'oggetto target da rendere reattivo.
   * @param {Array} path - Il percorso dell'oggetto nel proxy.
   * @returns {Proxy} Il proxy dell'oggetto target.
   */
  _createProxy(target, path = []) {
    const core = this;

    return new Proxy(target, {
      set(target, property, value) {
        target[property] = value;
        // Aggiunge il percorso della proprietà modificata al set di cambiamenti
        core.changes.add(path.concat(property).join("."));
        core._batchChanges();
        return true;
      },
      get(target, property, receiver) {
        const current = Reflect.get(target, property, receiver);
        if (current && typeof current === "object") {
          return core._createProxy(current, path.concat(property));
        }
        return current;
      },
    });
  }

  /**
   * Gestisce i cambiamenti in batch.
   */
  _batchChanges() {
    if (!this.isBatching) {
      this.isBatching = true;
      // Utilizza setTimeout per gestire i cambiamenti nello stesso ciclo di eventi
      setTimeout(() => {
        this.callback(Array.from(this.changes));
        this.changes.clear(); // Cancella i cambiamenti dopo l'esecuzione della callback
        this.isBatching = false;
      }, 0);
    }
  }
}