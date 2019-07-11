import ApolloClient from "apollo-client"
import fetch from "node-fetch"

import { createHttpLink } from "apollo-link-http"
import { InMemoryCache } from "apollo-cache-inmemory"
import { onError } from "apollo-link-error"
import { ApolloLink } from "apollo-link"
import { UnauthorizedError, MissingAuthTokenError } from "./errors"
import Command from "@oclif/command"
const { createUploadLink } = require("apollo-upload-client")
import * as FormData from "form-data"
import * as fs from "fs"

const { version } = require("../package.json")

const baseURL = process.env.FLY_BASE_URL || "https://fly.io"

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
  variables: any
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
      headers: this.headers,
      method: "POST",
      body: JSON.stringify({ query, variables })
    })

    if (resp.status === 401) {
      throw new UnauthorizedError()
    }

    console.log("status", resp.status)

    return await resp.json()
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

    if (resp.status === 401) {
      throw new UnauthorizedError()
    }

    console.log("status", resp.status)

    return await resp.json()
  }
}
