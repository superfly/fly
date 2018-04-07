import { Readable } from 'stream'
import { createReadStream } from 'fs'
import { resolve } from 'path';
import { getLocalRelease, getEnv, LocalRelease } from './utils/local';
import { Release } from '.';
import { FileStore, FileNotFound } from './file_store';

export class LocalFileStore implements FileStore {
  cwd: string
  release: LocalRelease

  constructor(cwd: string = process.cwd(), release: LocalRelease) {
    this.cwd = cwd
    this.release = release
  }

  async createReadStream(path: string, encoding?: string): Promise<Readable> {
    const found = this.findFile(path)
    if (found)
      return createReadStream(resolve(this.cwd, path), { encoding: encoding })
    throw new FileNotFound(`file '${path}' not found, make sure it's in your .fly.yml's \"files\" property`)
  }

  async exists(path: string) {
    return !!this.findFile(path)
  }

  private findFile(path: string) {
    console.log('looking for file: ', path)
    return this.release.files.find((f) => path === f)
  }
}
