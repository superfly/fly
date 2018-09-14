import { root, getAppName, CommonOptions, addCommonOptions } from "./root"
import { apiClient } from "./api"
import { processResponse } from "../utils/cli"

import colors = require("ansi-colors")
import { Command } from "commandpost"
import { AxiosInstance } from "axios"

export interface LogsOptions extends CommonOptions {}
export interface LogsArgs {}

const logs = root
  .subCommand<LogsOptions, LogsArgs>("logs")
  .description("Logs from your app.")
  .action(async function(this: Command<LogsArgs, LogsOptions>, opts, args, rest) {
    continuouslyGetLogs(apiClient(this), getAppName(this))
  })

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

async function continuouslyGetLogs(API: AxiosInstance, appName: string) {
  let lastNextToken: string | undefined
  while (true) {
    let count = 0
    try {
      const [logs, nextToken] = await getLogs(API, appName, lastNextToken)
      count = logs.length
      lastNextToken = nextToken
      showLogs(logs)
    } catch (e) {
      if (e.response) { processResponse(e.response) }
      else { console.log(e.stack) }
      break
    }
    await sleep(count > 5 ? 200 : 2500) // give it a rest!
  }
}

const levelColorFn: { [lvl: string]: (message: string) => string } = {
  info: colors.grey,
  debug: colors.cyan,
  error: colors.red,
  warning: colors.magenta
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
    const lvl = levels[parseInt(l.attributes.level)] || l.attributes.level
    const levelColor = levelColorFn[lvl] || colors.white
    console.log(
      `${colors.dim(ts.toISOString().split(".")[0] + "Z")} ${colors.green(region)} [${levelColor(
        lvl
      )}] ${l.attributes.message}`
    )
  }
}

async function getLogs(
  API: AxiosInstance,
  appName: string,
  nextToken?: string
): Promise<[any[], string | undefined]> {
  const res = await API.get(`/api/v1/apps/${appName}/logs`, {
    params: { next_token: nextToken }
  })
  if (res.data.data && res.data.meta) {
    return [res.data.data, res.data.meta.next_token || nextToken]
  }
  console.log("Got no data:", res.data.data)
  // no data that we want, likely an error, continuouslyGetLogs will catch and
  // process errors accordingly
  throw new LogResponseError(res)
}

function sleep(i: number) {
  return new Promise(res => setTimeout(res, i))
}

class LogResponseError extends Error {
  public response: Object

  constructor(response: Object, ...params: any[]) {
    super(...params)
    this.response = response
  }
}

addCommonOptions(logs)
