import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"
import { inspect } from "util"

export default class Status extends FlyCommand {
  static description = "Application status"

  public static flags = {
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  async run() {
    const { args, flags } = this.parse(Status)

    const client = this.gqlClient(flags)
    const appName = this.getAppName(flags)

    const resp = await client.query({
      query: APP_STATUS,
      variables: {
        appId: appName
      }
    })

    console.log(inspect(resp.data, { showHidden: true, depth: 10, colors: true }))
  }
}

const APP_STATUS = `
  query($appId: String!) {
    app(id: $appId) {
      id
      version
      runtime
      status
      services {
        id
        name
        status
        allocations {
          id
          name
          status
          region
          createdAt
          updatedAt
        }
      }
    }
  }
`
