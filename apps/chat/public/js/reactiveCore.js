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
        // Chiama direttamente la callback con il percorso della proprietà modificata
        core.callback([path.concat(property).join(".")]);
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
}