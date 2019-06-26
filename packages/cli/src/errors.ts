import { CLIError } from "@oclif/errors"

export class MissingAuthTokenError extends CLIError {
  constructor() {
    super("Please login again with `fly login`")
  }
}

export class UnauthorizedError extends CLIError {
  constructor() {
    super("Please login again with `fly login`, your token is probably expired.")
  }
}
