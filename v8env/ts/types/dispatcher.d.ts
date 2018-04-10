/**
 * @hidden
 * @private
 * @module fly
 */
export class Dispatcher {
  dispatchSync: (name: string, ...args: any[]) => any
  dispatch: (name: string, ...args: any[]) => Promise<any>
}