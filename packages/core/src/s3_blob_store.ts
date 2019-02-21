import { BlobStore, Body, KeyNotFound, GetResponse, SetOptions } from "./blob_store"
import { Readable } from "stream"
import { Runtime } from "./runtime"
import log from "./log"
import { createHash } from "crypto"

import * as AWS from "aws-sdk"
import { bufferToStream } from "./utils/buffer"
import { streamManager } from "./stream_manager"
import { String } from "aws-sdk/clients/cloudhsm"

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

    log.info("get:", { ns, key, params })

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

  public async set(ns: string, key: string, value: Body, opts?: SetOptions): Promise<boolean> {
    const reqOpts = {
      Key: getKey(ns, key),
      Bucket: this.bucket,
      Body: value
    }

    log.info("set:", { ns, key, reqOpts })

    try {
      const resp = await this.s3.putObject(reqOpts).promise()
      log.info("status", { status: resp.$response.httpResponse.statusCode })
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  public async del(ns: string, key: string): Promise<boolean> {
    log.info("del:", { ns, key })

    const reqOpts = {
      Key: getKey(ns, key),
      Bucket: this.bucket
    }

    const resp = await this.s3.deleteObject(reqOpts)
    log.info("resp", { resp })

    return true
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
