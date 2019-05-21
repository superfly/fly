import axios from "axios"
import { AxiosResponse } from "axios"
import { FlyCommand } from "./base-command"

const { version } = require("../package.json")

export function apiClient(token: string) {
  const baseURL = process.env.FLY_BASE_URL || "https://fly.io"

  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": `fly/${version}`
    },
    validateStatus: status => {
      return status >= 200 && status < 500
    }
  })
}

export function processResponse(cmd: FlyCommand, res: AxiosResponse, successFn?: () => void): void {
  if (res.status >= 200 && res.status < 299) {
    if (successFn) {
      successFn()
    }
  } else {
    console.log(res.status)
    if (res.status === 401) {
      // TODO: Store and use `refresh_token` to automatically fix this predicament
      return cmd.warn("Please login again with `fly login`, your token is probably expired.")
    } else if (res.data && res.data.errors) {
      for (const errMsg of getErrorMessages(res)) {
        cmd.error(`Error: ${errMsg}`)
      }
      cmd.exit(1)
    } else {
      throw new Error("Api Error, please try again.")
    }
  }
}

function getErrorMessages(res: AxiosResponse): string[] {
  if (res.data.errors) {
    return res.data.errors.map((err: any) => errorMessage(err))
  }
  return []
}

function errorMessage(err: any): string {
  if (typeof err === "string") {
    return err
  } else if (err.title && err.detail) {
    return `${err.title}: ${err.detail}`
  } else if (err.title) {
    return err.title
  } else if (err.detail) {
    if (err.source && err.source.pointer) {
      if (err.source.pointer.startsWith("/data/attributes/")) {
        return `${err.source.pointer.replace("/data/attributes/", "")} ${err.detail}`
      }
    }
    return err.detail
  }
  return ""
}
