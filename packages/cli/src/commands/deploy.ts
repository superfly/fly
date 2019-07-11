import { processResponse } from "../api"
import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"
import { FileAppStore } from "@fly/core"
import { createReleaseTarball } from "@fly/build"
import * as path from "path"
import * as fs from "fs"
import { inspect } from "util"

export default class Deploy extends FlyCommand {
  static description = "Deploy your local Fly app"

  static args = [{ name: "path", description: "path to app", default: process.cwd() }]

  public static flags = {
    env: sharedFlags.env({ default: "production" }),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  async run() {
    const { args, flags } = this.parse(Deploy)

    const env = flags.env!
    const cwd = args.path || process.cwd()
    const client = this.gqlClient(flags)
    const appName = this.getAppName({ ...flags })

    this.log("Deploying", appName, `(env: ${env})`)

    const appStore = new FileAppStore({ appDir: cwd, env })
    await appStore.build()

    const outFile = path.resolve(cwd, ".fly/release.tar.gz")
    const tarball = await createReleaseTarball(outFile, appStore.manifest())
    const stream = fs.createReadStream(tarball.path)

    const resp = await client.mutate({
      query: DEPLOY_TARBALL,
      variables: {
        input: {
          appId: appName,
          tarball: null
        }
      },
      attachments: { "variables.input.tarball": stream }
    })

    console.log(inspect(resp, { showHidden: true, depth: 10, colors: true }))

    // const app = resp.data.deployImage.deployment.app

    // if (app.ipAddresses.nodes.length > 0) {
    //   this.log(`--> https://${app.ipAddresses.nodes[0].address}`)
    // }

    // const res = await API.post(`/api/v1/apps/${appName}/releases`, stream, {
    //   params: {
    //     sha1: tarball.digest,
    //     env
    //   },
    //   headers: {
    //     "Content-Type": "application/x-tar",
    //     "Content-Encoding": "gzip"
    //   },
    //   maxContentLength: 100 * 1024 * 1024,
    //   timeout: 120 * 1000
    // })

    // processResponse(this, res, () => {
    //   this.log(`Deploying v${res.data.data.attributes.version} globally @ https://${appName}.edgeapp.net`)
    //   this.log(`App should be updated in a few seconds.`)
    // })
  }
}

const DEPLOY_TARBALL = `
  mutation($input: DeployTarballInput!) {
    deployTarball(input: $input) {
      deployment {
        id
        app {
          runtime
          status
          ipAddresses {
            nodes {
              address
            }
          }
        }
        status
        currentPhase
        release {
          version
        }
      }
    }
  }
`
