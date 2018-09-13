/**
 * @module timers
 */

declare var bridge: any

/**
 * Fires a callback function after the specified time elapses.
 * @param cb function to execute after time elapses
 * @param ms milliseconds to wait before executing
 * @return an ID for the newly created timeout
 */
export function setTimeout(cb, ms) {
  const ref = bridge.wrapFunction(cb)
  return bridge.dispatchSync("setTimeout", ref, ms)
}

/**
 * Cancels a previously specified timeout
 * @param id the id of the timeout to cancel
 */
export function clearTimeout(id) {
  bridge.dispatch("clearTimeout", id)
}

/**
 * Fires a callback after the current task yields
 * @param cb The callback to fire asynchronously
 */
export function setImmediate(cb) {
  setTimeout(cb, 0)
}

/**
 * Fires a callback over and over
 * @param cb The callback to fire every <ms> milliseconds
 * @param ms Milliseconds to wait between intervals
 * @return id of newly created interval
 */
export function setInterval(cb, ms) {
  const ref = bridge.wrapFunction(cb)
  return bridge.dispatchSync("setInterval", ref, ms)
}

/**
 * Cancels the previously created interval
 * @param id The interval ID to cancel
 */
export function clearInterval(id) {
  bridge.dispatch("clearInterval", id)
}