import { BlobStore } from "./blob_store"
import { Readable } from "stream"
import { Runtime } from "./runtime"
import log from "./log"

import * as AWS from "aws-sdk"
import { bufferToStream } from "./utils/buffer"

export interface Options {
  secretAccessKey: string
  accessKeyId: string
  bucket: string
}

export class S3BlobStore implements BlobStore {
  private s3: AWS.S3
  private bucket: string

  constructor(options: Options) {
    this.bucket = options.bucket

    this.s3 = new AWS.S3({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      s3BucketEndpoint: true,
      endpoint: "http://flytest.sfo2.digitaloceanspaces.com"
    })
  }

  public async get(ns: string, key: string): Promise<Readable> {
    log.info("get:", { ns, key })
    const fullKey = `${ns}/${key}`
    const reqOpts = {
      Key: fullKey,
      Bucket: this.bucket
    }

    return await this.s3.getObject(reqOpts).createReadStream()
  }

  public set(ns: string, key: string, value: Readable): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
  public del(ns: string, key: string): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
}
