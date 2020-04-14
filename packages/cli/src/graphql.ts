import fetch, { Response } from "node-fetch"
import { UnauthorizedError, MissingAuthTokenError } from "./errors"
import * as FormData from "form-data"
import * as fs from "fs"

const { version } = require("../package.json")

const baseURL = process.env.FLY_BASE_URL || "https://api.fly.io"

export function gqlClient(token: string) {
  return new GraphQLClient(token)
}

interface MutateOptions {
  query: string
  variables: any
  attachments?: { [varPath: string]: fs.ReadStream }
}

interface QueryOptions {
  query: string
  variables?: { [key: string]: any }
}

export class GraphQLClient {
  public readonly uri: string

  public readonly headers: { [name: string]: string }

  constructor(token: string) {
    this.uri = `${baseURL}/api/v2/graphql`
    this.headers = {
      Authorization: `Bearer ${token}`,
      "User-Agent": `fly/${version}`
    }
  }

  public async query(options: QueryOptions) {
    const { query, variables } = options

    const resp = await fetch(this.uri, {
      headers: Object.assign(
        {
          "Content-Type": "application/json"
        },
        this.headers
      ),
      method: "POST",
      body: JSON.stringify({ query, variables })
    })

    return await this.processResponse(resp)
  }

  public async mutate(options: MutateOptions) {
    const body = new FormData()

    const { query, variables, attachments = {} } = options

    body.append(
      "operations",
      JSON.stringify({
        query,
        variables
      }),
      { contentType: "application/json" }
    )

    const mappings = Object.assign({}, Object.keys(attachments).map(k => [k]))
    body.append("map", JSON.stringify(mappings))
    for (const [index, stream] of Object.entries(Object.values(attachments))) {
      body.append(index, stream)
    }

    const resp = await fetch(this.uri, {
      headers: this.headers,
      method: "POST",
      body
    })

    return await this.processResponse(resp)
  }

  private async processResponse(resp: Response) {
    if (resp.status === 401) {
      throw new UnauthorizedError()
    }

    const payload = await resp.json()

    if (payload.errors) {
      const error = payload.errors[0]
      const code = error.extensions && error.extensions.code

      if (code === "SERVER_ERROR") {
        throw new ServerError(error.message)
      } else {
        throw new ClientError(error)
      }
    } else {
      return payload
    }
  }
}

interface ErrorData {
  message: string
  extensions: any
}

export class ClientError extends Error {
  public readonly errorData: ErrorData
  public readonly code: string

  constructor(error: ErrorData) {
    super(error.message)
    this.errorData = error
    this.code = error.extensions && error.extensions.code
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message)
  }
}
