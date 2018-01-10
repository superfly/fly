// Processing chain: pass each request through a list of handlers
//
// Each handler called with ClientRequest object and must pass control to
// callback with either error, ServerResponse object, or no arguments to pass
// control to the next handler.

module.exports = class Chain {

  constructor() {
    // Linked list of handlers; each handler has a reference to the next one
    this.first = null;
    this.last  = null;
  }

  // Appends a handler to the chain (invoked before all other handlers)
  append(handler) {
    const layer = this._wrap(handler);
    this.first  = this.first || layer;
    if (this.last)
      this.last.next = layer;
    this.last   = layer;
    return this;
  }

  // Prepends a handler to the chain (invoked after all other handlers)
  prepend(handler) {
    const layer = this._wrap(handler);
    layer.next = this.first;
    this.first = layer;
    this.last  = this.last || layer;
    return this;
  }

  // Clears the chain of all its handlers
  clear() {
    this.first = this.last = null;
  }

  // Returns the first handler in the chain
  get start() {
    return this.first;
  }


  // Wraps a handler and returns a function that will invoke this handler, and
  // if the handler does not return a response, pass control to the next handler
  // in the chain
  _wrap(handler) {
    function layer(request, callback) {
      handler(request, function(error, response) {
        if (error || response)
          callback(error, response);
        else if (layer.next)
          layer.next(request, callback);
        else
          callback();
      });
    }
    return layer;
  }

};

