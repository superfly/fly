import { BlobStore, KeyNotFound, GetResponse, SetOptions } from "./blob_store"
import { Readable } from "stream"
import log from "./log"
import { createHash } from "crypto"
import * as AWS from "aws-sdk"

export interface Options {
  secretAccessKey?: string
  accessKeyId?: string
  endpoint: string
  bucket: string
}

type AWSRequest<T> = AWS.Request<T, AWS.AWSError>

export class S3BlobStore implements BlobStore {
  private s3: AWS.S3

  private bucket: string

  constructor(options: Options) {
    this.bucket = options.bucket

    this.s3 = new AWS.S3({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      s3BucketEndpoint: true,
      endpoint: options.endpoint
    })
  }

  public get(ns: string, key: string): Promise<GetResponse> {
    const params = {
      Key: getKey(ns, key),
      Bucket: this.bucket
    }

    log.debug("get:", { ns, key, params })

    return new Promise((resolve, reject) => {
      const stream = this.s3
        .getObject(params)
        .on("httpHeaders", function onHttpHeaders(this: any, statusCode, headers) {
          if (statusCode >= 200 && statusCode < 300) {
            resolve({
              stream,
              headers
            })
          }
        })
        .createReadStream()
        .on("error", err => {
          if (err.name === "NoSuchKey") {
            err = new KeyNotFound(`Key`)
          }
          reject(err)
        })
    })
  }

  public async set(ns: string, key: string, value: Readable, opts?: SetOptions): Promise<boolean> {
    const headers = (opts && opts.headers) || {}

    let contentLength
    if (headers["content-length"]) {
      try {
        contentLength = parseInt(headers["content-length"], 10)
      } catch (_) {
        // ignore junk
      }
    }

    const reqOpts: AWS.S3.PutObjectRequest = {
      Key: getKey(ns, key),
      Bucket: this.bucket,
      Body: value,
      ContentLength: contentLength,
      ContentType: headers["content-type"],
      ContentEncoding: headers["content-encoding"]
    }

    log.debug("set:", { ns, key, reqOpts })

    try {
      const resp = await this.s3.putObject({ ...reqOpts }).promise()
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  public async del(ns: string, key: string): Promise<boolean> {
    log.debug("del:", { ns, key })

    const reqOpts = {
      Key: getKey(ns, key),
      Bucket: this.bucket
    }

    const resp = await this.s3.deleteObject(reqOpts).promise()

    return true
  }

  public toString() {
    return `S3 [bucket:${this.bucket} endpoint:${this.s3.endpoint.href}]`
  }
}

function getKey(ns: string, key: string): string {
  ns = ns.replace(/\//g, "-")
  if (key.startsWith("/")) {
    key = key.substring(1)
  }

  if (key.length === 0) {
    throw new Error(`Key cannot be empty`)
  }

  key = digestKey(key)

  return `${ns}/${key}`
}

function digestKey(key: string): string {
  return createHash("md5")
    .update(key)
    .digest("hex")
}
