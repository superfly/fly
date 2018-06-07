import { root, getAppName, CommonOptions, addCommonOptions } from './root'
import { apiClient } from './api'
import { processResponse } from '../utils/cli'

import log from '../log'

import colors = require('ansi-colors')
import { Command } from 'commandpost';
import { AxiosInstance } from 'axios';

export interface LogsOptions extends CommonOptions { }
export interface LogsArgs { }

const logs = root
  .subCommand<LogsOptions, LogsArgs>("logs")
  .description("Logs from your app.")
  .action(async function (this: Command<LogsArgs, LogsOptions>, opts, args, rest) {
    continuouslyGetLogs(apiClient(this), getAppName(this))
  })

async function continuouslyGetLogs(API: AxiosInstance, appName: string) {
  log.silly("continuously get logs for app id:", appName)
  let lastNextToken: string | undefined;
  while (true) {
    try {
      const [logs, nextToken] = await getLogs(API, appName, lastNextToken)
      lastNextToken = nextToken
      showLogs(logs)
    } catch (e) {
      if (e.response)
        processResponse(e.response)
      else
        console.log(e.stack)
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

async function getLogs(API: AxiosInstance, appName: string, nextToken?: string): Promise<[any[], string | undefined]> {
  const res = await API.get(`/api/v1/apps/${appName}/logs`, {
    params: { next_token: nextToken }
  })
  if (res.data.data && res.data.meta) {
    return [res.data.data, res.data.meta.next_token]
  }
  // no data that we want, likely an error, continuouslyGetLogs will catch and
  // process errors accordingly
  throw new LogResponseError(res)
}

function sleep(i: number) {
  return new Promise((res) => setTimeout(res, i))
}

class LogResponseError extends Error {
  response: Object

  constructor(response: Object, ...params: any[]) {
    super(...params)
    this.response = response
  }
}

addCommonOptions(logs)