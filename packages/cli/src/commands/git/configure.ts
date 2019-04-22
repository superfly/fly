import { FlyCommand } from "../../base-command"
import * as sharedFlags from "../../flags"
import { getAppName } from "../../util"
import { getToken, storeNetrcCredentials } from "../../credentials"
import * as execa from "execa"
import * as fs from "fs"
import * as path from "path"

export default class Configure extends FlyCommand {
  public static description = "configure remote and credentials for git deployments"

  public static flags = { env: sharedFlags.env(), app: sharedFlags.app() }

  static args = [{ name: "name", description: "name of the remote", default: "fly" }]

  static hidden = true

  public async run() {
    const { args, flags } = this.parse(Configure)

    const appName = getAppName(flags)
    const remoteName = args.name
    const token = getToken(this)
    const host = "git.fly.io"
    const url = `https://${host}/${appName}.git`

    if (token) {
      storeNetrcCredentials(host, token)
    }

    if (!(await isGitRepo())) {
      this.error("This directory is not a git repo")
      this.exit(1)
    }

    if (await hasRemote(remoteName)) {
      this.log(`git remote "${remoteName}" already exists`)
      return
    }

    if (await createRemote(remoteName, url)) {
      this.log(`created remote "${remoteName}" to url "${url}"`)
    }
  }
}

async function isGitRepo() {
  const exec = await execa("git", ["remote"], {})
  return exec.code === 0
}

async function hasRemote(name: string) {
  const exec = await execa("git", ["remote"])
  if (exec.code === 0) {
    return exec.stdout.split("\n").includes(name)
  }

  throw new Error(`Error checking remote:\n${exec.stdout}`)
}

async function createRemote(name: string, url: string) {
  const exec = await execa("git", ["remote", "add", name, url])
  if (exec.code === 0) {
    return true
  }

  throw new Error(`Error creating remote:\n${exec.stdout}`)
}
