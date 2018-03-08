import { Readable } from "stream";

export interface FileStore {
  createReadStream(path: string, encoding?: string): Promise<Readable>
  exists(path: string): Promise<Boolean>
}

export class FileNotFound extends Error { }