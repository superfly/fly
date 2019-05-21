import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"
import { AxiosInstance } from "axios"
import chalk from "chalk"

export default class Logs extends FlyCommand {
  public static description = "logs for an app"

  public static flags = {
    env: sharedFlags.env(),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  public async run() {
    const { flags } = this.parse(Logs)

    const API = this.apiClient(flags)
    const appName = this.getAppName(flags)

    await this.continuouslyGetLogs(API, appName)
  }

  async continuouslyGetLogs(API: AxiosInstance, appName: string) {
    let lastNextToken: string | undefined
    while (true) {
      let count = 0
      try {
        const [logs, nextToken] = await getLogs(API, appName, lastNextToken)
        count = logs.length
        lastNextToken = nextToken
        showLogs(logs)
      } catch (e) {
        // ignore errors since we'll try again. maybe need to exit after too many errors...
      }
      await sleep(count > 5 ? 200 : 2500) // give it a rest!
    }
  }
}

const levels: { [key: number]: string } = {
  7: "debug",
  6: "info",
  5: "notice",
  4: "warning",
  3: "error",
  2: "crit",
  1: "alert",
  0: "emerg"
}

const levelColorFn: { [lvl: string]: (message: string) => string } = {
  info: chalk.gray,
  debug: chalk.cyan,
  error: chalk.red,
  warning: chalk.magenta
}

interface LogAttributes {
  timestamp: number
  level: string
  message: string
  meta: any
}

interface Log {
  attributes: LogAttributes
}

async function showLogs(logs: Log[]) {
  for (const l of logs) {
    const region = l.attributes.meta.region
    const ts = new Date(l.attributes.timestamp)
    const lvl = levels[parseInt(l.attributes.level, 10)] || l.attributes.level
    const levelColor = levelColorFn[lvl] || chalk.white
    console.log(
      `${chalk.dim(ts.toISOString().split(".")[0] + "Z")} ${chalk.green(region)} [${levelColor(lvl)}] ${
        l.attributes.message
      }`
    )
  }
}

async function getLogs(API: AxiosInstance, appName: string, nextToken?: string): Promise<[any[], string | undefined]> {
  const res = await API.get(`/api/v1/apps/${appName}/logs`, {
    params: { next_token: nextToken }
  })
  if (res.data.data && res.data.meta) {
    return [res.data.data, res.data.meta.next_token || nextToken]
  }
  return [[], nextToken]
}

function sleep(i: number) {
  return new Promise(res => setTimeout(res, i))
}
