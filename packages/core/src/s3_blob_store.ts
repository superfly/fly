import { BlobStore } from "./blob_store"
import { Readable } from "stream"
import { Runtime } from "./runtime"

import * as AWS from "aws-sdk"

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

  public get(ns: string, key: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const fullKey = `${ns}/${key}`
      const reqOpts = {
        Key: fullKey,
        Bucket: this.bucket
      }

      this.s3.getObject(reqOpts, (err, data) => {
        console.log("got response", { err, data })
        if (err) {
          reject(err)
        } else {
          resolve(data.Body as Readable)
        }
      })
    })
  }

  public set(ns: string, key: string, value: any): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
  public del(ns: string, key: string): Promise<boolean> {
    throw new Error("Method not implemented.")
  }

  // public async createReadStream(rt: Runtime, path: string): Promise<Readable> {
  //   const resp = await this.s3.getObject({
  //     Bucket: "flytest",
  //     Key: path
  //   })

  //   return resp.createReadStream()
  // }

  // public async createWritableStream(rt: Runtime, path: string): Promise<Readable> {
  //   const resp = await this.s3.getObject({
  //     Bucket: "flytest",
  //     Key: path
  //   })

  //   return resp.createReadStream()
  // }
}
