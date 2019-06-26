import ApolloClient from "apollo-client"
import fetch from "node-fetch"

import { createHttpLink } from "apollo-link-http"
import { InMemoryCache } from "apollo-cache-inmemory"
import { onError } from "apollo-link-error"
import { ApolloLink } from "apollo-link"
import { UnauthorizedError, MissingAuthTokenError } from "./errors"
import Command from "@oclif/command"

const { version } = require("../package.json")

const baseURL = process.env.FLY_BASE_URL || "https://fly.io"

export function gqlClient(cmd: Command, token: string) {
  const httpLink = createHttpLink({
    uri: `${baseURL}/api/v2/graphql`,
    fetch,
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": `fly/${version}`
    }
  })

  const errorLink = onError(ctx => {
    if (ctx.networkError && (ctx.networkError as any).statusCode === 401) {
      cmd.warn("received network error")
      throw new UnauthorizedError()
    }
  })

  const cache = new InMemoryCache()

  return new ApolloClient({
    link: ApolloLink.from([errorLink, httpLink]),
    cache
  })
}
