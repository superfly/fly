import { FlyCommand } from "../../base-command"
import * as sharedFlags from "../../flags"
import { getAppName } from "../../util"

export default class Git extends FlyCommand {
  public static description = "git deployment tools for an app"

  public static flags = { env: sharedFlags.env(), app: sharedFlags.app() }

  static hidden = true

  public async run() {
    const { flags } = this.parse(Git)

    const appName = getAppName(flags)

    if (appName) {
      console.log(`Git URL: https://git.fly.io/${appName}.git`)
    }
  }
}
