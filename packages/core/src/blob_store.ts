import { Readable } from "stream"
import { Runtime } from "./runtime"

export interface BlobStore {
  get(ns: string, key: string): Promise<Readable>
  set(ns: string, key: string, value: Readable): Promise<boolean>
  del(ns: string, key: string): Promise<boolean>
}

export class BlobNotFound extends Error {}
