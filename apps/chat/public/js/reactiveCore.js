class ReactiveCore {
  constructor(target, callback) {
    this.originalObject = target;
    this.callback = callback;
    this.changes = new Set(); // Store paths of changed properties
    this.isBatching = false;

    return this._createProxy(target);
  }

  _createProxy(target, path = []) {
    const core = this;

    return new Proxy(target, {
      set(target, property, value) {
        target[property] = value;
        // Add the path of the changed property to the changes set
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

  _batchChanges() {
    if (!this.isBatching) {
      this.isBatching = true;
      // Use setTimeout to batch changes within the same event loop tick
      setTimeout(() => {
        this.callback(Array.from(this.changes));
        this.changes.clear(); // Clear the changes after callback execution
        this.isBatching = false;
      }, 0);
    }
  }
}