import { Readable } from "stream"
import { Runtime } from "./runtime"

export type Body = Buffer | Uint8Array | string | Readable

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
  set(ns: string, key: string, value: Body, opts?: SetOptions): Promise<boolean>
  del(ns: string, key: string): Promise<boolean>
}

export class KeyNotFound extends Error {
  constructor(key: string) {
    super(`key "${key}" not found`)
  }
}

export class ServiceError extends Error {}
