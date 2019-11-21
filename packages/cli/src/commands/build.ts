import * as glob from "glob"
import { resolve as pathResolve } from "path"
import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"
import { DevAppStore } from "../dev"
import * as path from "path"
import { createReleaseTarball } from "@fly/build"
import Command, { flags as cmdFlags } from "@oclif/command"

export default class Build extends FlyCommand {
  static description = "Build your local Fly app"

  static args = [
    {
      name: "path",
      description: "path to app",
      default: "."
    }
  ]

  public static flags = {
    env: sharedFlags.env(),
    app: sharedFlags.app(),
    output: cmdFlags.string({
      description: "Path to output file",
      char: "o",
      default: ".fly/release.tar.gz",
      required: true
    })
  }

  async run() {
    const { args, flags } = this.parse(Build)
    const env = flags.env!
    const cwd = path.resolve(process.cwd(), args.path)
    const outFile = path.resolve(cwd, flags.output)
    const appName = this.getAppName({ ...flags, cwd })

    this.log("Building", appName, `(env: ${env}, path: ${cwd})`)

    const appStore = new DevAppStore({ appDir: cwd, env })
    await appStore.build()
    const tarball = await createReleaseTarball(outFile, appStore.manifest())

    this.log("Release bundle created:")
    this.log(`  path: ${tarball.path}`)
    this.log(`  size: ${tarball.byteLength}`)
    this.log(`  digest: ${tarball.digest}`)
  }
}
