import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"
import { inspect } from "util"
import { PrintKVList } from "../ui"
import { cli } from "cli-ux"

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

    const { app } = resp.data

    PrintKVList({
      Name: app.name,
      Owner: app.organization.slug,
      Version: app.version,
      Runtime: app.runtime,
      Status: app.status,
      "App URL": app.appUrl
    })

    if (app.services.length > 0) {
      const services = []
      const allocations = []

      for (const service of app.services) {
        services.push(service)

        allocations.push(...service.allocations)
      }

      console.log()

      cli.table(services, {
        name: {},
        status: {}
      })

      console.log()

      cli.table(allocations, {
        name: {},
        region: {},
        status: {},
        createdAt: {
          header: "Created"
        },
        updatedAt: {
          header: "Modified"
        }
      })
    }
  }
}

const APP_STATUS = `
  query($appId: String!) {
    app(id: $appId) {
      id
      name
      version
      runtime
      status
      appUrl
      organization {
        slug
      }
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
