import * as glob from "glob"
import { resolve as pathResolve } from "path"
import { FlyCommand } from "../base-command"
import { getAppName } from "../util"
import * as sharedFlags from "../flags"
import { FileAppStore } from "@fly/core"
import * as path from "path"
import { createReleaseTarball } from "@fly/build"

export default class Build extends FlyCommand {
  static description = "Build your local Fly app"

  static args = [
    {
      name: "path",
      description: "path to app",
      default: process.cwd()
    },
    {
      name: "outFile",
      description: "path to output file",
      default: ".fly/release.tar.gz"
    }
  ]

  public static flags = {
    env: sharedFlags.env({ default: "production" }),
    app: sharedFlags.app()
  }

  async run() {
    const { args, flags } = this.parse(Build)
    const env = flags.env!
    const cwd = args.path || process.cwd()
    const outFile = args.outFile || path.resolve(cwd, ".fly/release.tar.gz")
    const appName = getAppName({ ...flags, cwd })

    this.log("Building", appName, `(env: ${env})`)

    const appStore = new FileAppStore({ appDir: cwd, env })
    await appStore.build()
    const tarball = await createReleaseTarball(outFile, appStore.manifest())

    this.log("Release bundle created:")
    this.log(`  path: ${tarball.path}`)
    this.log(`  size: ${tarball.byteLength}`)
    this.log(`  digest: ${tarball.digest}`)
  }
}
