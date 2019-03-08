import { BlobStore, KeyNotFound, GetResponse, SetOptions, generateKey } from "./blob_store"
import { Readable } from "stream"
import log from "./log"
import * as fs from "fs"
import { join, dirname } from "path"
import { tmpdir } from "os"

export interface Options {
  path?: string
}

export class FileSystemBlobStore implements BlobStore {
  private path: string

  constructor(options?: Options) {
    this.path = (options && options.path) || join(tmpdir(), "fly-blobcache")

    ensurePath(this.path)
  }

  public get(ns: string, key: string): Promise<GetResponse> {
    return new Promise((resolve, reject) => {
      const [, dataPath, metaPath] = this.getPaths(ns, key)

      if (!fs.existsSync(dataPath) || !fs.existsSync(metaPath)) {
        reject(new KeyNotFound(key))
        return
      }

      let headers

      try {
        headers = JSON.parse(fs.readFileSync(metaPath, "utf8"))
      } catch (err) {
        log.warn("[FileSystemBlobStore] error reading meta", { ns, key }, err)
        reject(err)
      }

      try {
        const stream = fs.createReadStream(dataPath)

        resolve({
          headers,
          stream
        })
      } catch (err) {
        log.warn("[FileSystemBlobStore] error reading file", { ns, key }, err)
      }
    })
  }

  public set(ns: string, key: string, value: Readable, opts?: SetOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const [nsPath, dataPath, metaPath] = this.getPaths(ns, key)

        ensurePath(nsPath)

        let headers = {}
        if (opts && opts.headers) {
          headers = { ...headers, ...opts.headers }
        }

        const stream = fs.createWriteStream(dataPath)
        value.pipe(stream)

        fs.writeFileSync(metaPath, JSON.stringify(headers), "utf8")

        resolve(true)
      } catch (err) {
        log.warn("[FileSystemBlobStore] set error", err)
        reject(err)
      }
    })
  }

  public del(ns: string, key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [, dataPath, metaPath] = this.getPaths(ns, key)

      try {
        fs.unlinkSync(dataPath)
        fs.unlinkSync(metaPath)

        resolve(true)
      } catch (err) {
        log.warn("[FileSystemBlobStore] del error", err)
        reject(err)
      }
    })
  }

  public toString() {
    return `Disk [path:${this.path}]`
  }

  private getPaths(ns: string, key: string) {
    const fullKey = generateKey(ns, key)
    const dataPath = join(this.path, fullKey)
    const metaPath = join(this.path, fullKey + ".meta")
    return [dirname(dataPath), dataPath, metaPath]
  }
}

function ensurePath(path: string) {
  try {
    fs.mkdirSync(path, { recursive: true })
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err
    }
  }
}
