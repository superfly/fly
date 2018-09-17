import colors = require("ansi-colors")
import { AxiosResponse } from "axios"

function getErrorMessages(res: any): string[] {
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

export function processResponse(res: any, successFn?: (res: AxiosResponse) => void): void {
  if (res.status >= 200 && res.status < 299) {
    if (successFn) {
      successFn(res)
    }
  } else {
    if (res.status == 401) {
      // TODO: Store and use `refresh_token` to automatically fix this predicament
      return console.log("Please login again with `fly login`, your token is probably expired.")
    }
    for (const errMsg of getErrorMessages(res)) {
      console.error(colors.red("Error:"), errMsg)
    }
  }
}
