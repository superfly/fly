/**
 * @hidden
 * @private
 * @module fly
 */
export class Dispatcher {
  public dispatchSync: (name: string, ...args: any[]) => any
  public dispatch: (name: string, ...args: any[]) => Promise<any>
}
