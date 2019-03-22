import { FlyCommand } from "../../base-command"
import { apiClient } from "../../api"
import { processResponse } from "cli/src/api"
import * as sharedFlags from "../../flags"
import { getAppName } from "cli/src/util"

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
