import { Readable } from "stream"
import { Runtime } from "./runtime"

export interface FileStore {
  createReadStream(rt: Runtime, path: string, encoding?: string): Promise<Readable>
  exists(rt: Runtime, path: string): Promise<boolean>
}

export class FileNotFound extends Error {}
