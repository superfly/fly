import Command, { flags as oclifFlags } from "@oclif/command"
import Help from "@oclif/plugin-help"
import * as Config from "@oclif/config"
import * as Parser from "@oclif/parser"
import { IFlag } from "@oclif/parser/lib/flags"
import { getSavedAccessToken } from "./credentials"
import { apiClient } from "./api"
import { FileAppStore } from "@fly/core"
import { isValidAppName } from "./util"
import { gqlClient } from "./graphql"
import { UnauthorizedError, MissingAuthTokenError } from "./errors"

export abstract class FlyCommand extends Command {
  protected apiToken(flags?: { token?: string }): string {
    let token: string | undefined

    if (flags && flags.token) {
      token = flags.token
    }

    if (!token) {
      token = getSavedAccessToken()
    }

    if (!token) {
      throw new MissingAuthTokenError()
    }

    return token
  }

  protected getAppName(flags: { app?: string; cwd?: string; env?: string }) {
    let { app, cwd } = flags

    if (!cwd) {
      cwd = process.cwd()
    }

    if (!app) {
      if (!flags.env) {
        return this.error("--env option or FLY_ENV variable needs to be set.")
      }

      const appStore = new FileAppStore({ appDir: cwd, env: flags.env })
      app = appStore.app.name
    }

    if (!app) {
      return this.error("--app option or app (in your .fly.yml) needs to be set.")
    }

    if (!isValidAppName(app)) {
      return this.error(`${app} is not a valid app name`)
    }

    return app
  }

  protected apiClient(flags?: { token?: string }) {
    return apiClient(this.apiToken(flags))
  }

  protected gqlClient(flags?: { token?: string }) {
    return gqlClient(this, this.apiToken(flags))
  }

  /**
   * atm oclif-help doesn't list subcommands when calling command._help()
   * this works around the limitation until it's fixed upstream
   */
  protected showMoreDetailedHelp() {
    const x = new Help(this.config, { all: true })
    x.showCommandHelp(Config.Command.toCached((this.ctor as any) as Config.Command.Class), this.config.topics)
  }

  protected async catch(err: any): Promise<any> {
    if (err instanceof MissingAuthTokenError) {
      return this.error(
        "API token not found. Provide one with the `token` flag, FLY_ACCESS_TOKEN variable, or by running `fly login`."
      )
    }
    if (err.networkError) {
      switch (err.networkError.statusCode) {
        case 401:
          return this.error("Please login again with `fly login`, your token is probably expired.")
        case 500:
          return this.error("An unknown error occured. Please try again.")
      }
    }
    return super.catch(err)
  }
}
