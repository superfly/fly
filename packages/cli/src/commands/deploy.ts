import { apiClient, processResponse } from "../api"
import log from "@fly/core/lib/log"
import * as tar from "tar-fs"
import * as glob from "glob"
import { createWriteStream, readFileSync, existsSync } from "fs"
import { createHash } from "crypto"
import * as pako from "pako"
import { AxiosResponse } from "axios"
import { resolve as pathResolve } from "path"
import { FlyCommand } from "../base-command"
import { getAppName, fullAppMatch } from "../util"
import * as sharedFlags from "../flags"
import { FileAppStore } from "@fly/core"
import { createReleaseTarball } from "@fly/build"
import * as path from "path"
import * as fs from "fs"

export default class Deploy extends FlyCommand {
  static description = "Deploy your local Fly app"

  static args = [{ name: "path", description: "path to app", default: process.cwd() }]

  public static flags = {
    env: sharedFlags.env({ default: "production" }),
    app: sharedFlags.app()
  }

  async run() {
    const { args, flags } = this.parse(Deploy)
    const API = apiClient(this)
    const env = flags.env!
    const cwd = args.path || process.cwd()
    const appName = getAppName({ ...flags, cwd })

    this.log("Deploying", appName, `(env: ${env})`)

    const appStore = new FileAppStore({ path: cwd, env, build: false })
    await appStore.build()

    const outFile = path.resolve(cwd, ".fly/release.tar.gz")
    const tarball = await createReleaseTarball(outFile, appStore.manifest())

    const gz = fs.createReadStream(tarball.path)

    const res = await API.post(`/api/v1/apps/${appName}/releases`, gz, {
      params: {
        sha1: tarball.digest,
        env
      },
      headers: {
        "Content-Type": "application/x-tar",
        "Content-Length": tarball.byteLength,
        "Content-Encoding": "gzip"
      },
      maxContentLength: 100 * 1024 * 1024,
      timeout: 120 * 1000
    })

    processResponse(this, res, () => {
      this.log(`Deploying v${res.data.data.attributes.version} globally @ https://${appName}.edgeapp.net`)
      this.log(`App should be updated in a few seconds.`)
    })
  }
}
