import { FlyCommand } from "../../base-command"

export default class Secrets extends FlyCommand {
  public static description = "manage app secrets"

  // static flags = {
  //   app: sharedFlags.app(),
  //   env: sharedFlags.env()
  // }

  public async run() {
    this._help()
  }
}
