import { FlyCommand } from "../../base-command"

export default class Secrets extends FlyCommand {
  public static description = "manage app secrets"

  public async run() {
    this.showMoreDetailedHelp()
  }
}
