import { root, getAppId } from './root'
import { API } from './api'

import colors = require('ansi-colors')

export interface LogsOptions { }
export interface LogsArgs { }

root
  .subCommand<LogsOptions, LogsArgs>("logs")
  .description("Logs from your app.")
  .action(async (opts, args, rest) => {
    continuouslyGetLogs(getAppId())
  })

async function continuouslyGetLogs(appID: string) {
  let lastNextToken: string | undefined;
  while (true) {
    try {
      const [logs, nextToken] = await getLogs(appID, lastNextToken)
      lastNextToken = nextToken
      showLogs(logs)
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        console.log(e)
      break;
    }
    await sleep(5000) // give it a rest!
  }
}

const levelColorFn: { [lvl: string]: (message: string) => string } = {
  "info": colors.blue,
  "debug": colors.cyan,
  "error": colors.red,
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
    const levelColor = levelColorFn[l.attributes.level] || colors.white
    console.log(`${colors.dim(new Date(l.attributes.timestamp).toISOString())} [${levelColor(l.attributes.level)}] ${l.attributes.message}`)
  }
}

async function getLogs(appID: string, nextToken?: string): Promise<[any[], string]> {
  const res = await API.get(`/api/v1/apps/${appID}/logs`, {
    params: { next_token: nextToken }
  })
  return [res.data.data, res.data.meta.next_token]
}

function sleep(i: number) {
  return new Promise((res) => setTimeout(res, i))
}