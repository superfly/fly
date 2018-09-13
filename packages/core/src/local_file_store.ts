import { Readable } from 'stream'
import { createReadStream } from 'fs'
import { resolve } from 'path';
import { getLocalRelease, getEnv, LocalRelease } from './utils/local';
import { Release } from '.';
import { FileStore, FileNotFound } from './file_store';
import { Runtime } from './runtime';

export class LocalFileStore implements FileStore {
  cwd: string

  constructor(cwd: string = process.cwd(), release: LocalRelease) {
    this.cwd = cwd
  }

  async createReadStream(rt: Runtime, path: string, encoding?: string): Promise<Readable> {
    const found = this.findFile(rt.app.files || [], path)
    if (found)
      return createReadStream(resolve(this.cwd, path), { encoding: encoding })
    throw new FileNotFound(`file '${path}' not found, make sure it's in your .fly.yml's \"files\" property`)
  }

  async exists(rt: Runtime, path: string) {
    if (!rt.app.files)
      return false
    return !!this.findFile(rt.app.files || [], path)
  }

  private findFile(files: string[], path: string) {
    return files.find((f) => path === f)
  }
}