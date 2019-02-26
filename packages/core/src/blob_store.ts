import { Readable } from "stream"
import { createHash } from "crypto"

export interface Headers {
  [key: string]: string
}

export interface GetResponse {
  stream: Readable
  headers: Headers
}

export interface SetOptions {
  headers: Headers
}

export interface BlobStore {
  get(ns: string, key: string): Promise<GetResponse>
  set(ns: string, key: string, value: Readable, opts?: SetOptions): Promise<boolean>
  del(ns: string, key: string): Promise<boolean>
  toString(): string
}

export class KeyNotFound extends Error {
  constructor(key: string) {
    super(`key "${key}" not found`)
  }
}

export class ServiceError extends Error {}

export function generateKey(ns: string, key: string): string {
  ns = digest(ns)

  if (key.startsWith("/")) {
    key = key.substring(1)
  }

  if (key.length === 0) {
    throw new Error(`Key cannot be empty`)
  }

  key = digest(key)

  return `${ns}/${key}`
}

function digest(key: string): string {
  return createHash("md5")
    .update(key)
    .digest("hex")
}
