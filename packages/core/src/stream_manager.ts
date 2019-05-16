import { Runtime } from "./runtime"
import { Readable, Writable, PassThrough, Duplex } from "stream"
import { ivm } from "."
import { transferInto } from "./utils/buffer"
import log from "./log"
import { setTimeout } from "timers"
import { registerBridge } from "./bridge"

export interface StreamInfo {
  stream: Readable
  addedAt: number
  readLength: number
  endedAt: number
  readTimeout: NodeJS.Timer
}

export const streams: { [key: string]: StreamInfo } = {}

let lastStreamId = 0

export interface StreamOptions {
  readTimeout?: number
}

const MIN_READ_TIMEOUT = 30 * 1000
const MAX_READ_TIMEOUT = 2 * 60 * 1000

export const streamManager = {
  get(rt: Runtime, id: number | string): Readable {
    const key = streamKey(rt, id)
    const streamInfo = streams[key]
    if (!streamInfo) {
      throw new Error(`stream ${key} not found`)
    }
    if (streamInfo.stream instanceof Readable) {
      return streamInfo.stream
    }
    throw new Error("Stream is not readable")
  },

  add(rt: Runtime, stream: Readable, opts: StreamOptions = {}): number {
    const id = generateStreamId()
    const key = streamKey(rt, id)
    const readTimeoutMS = opts.readTimeout
      ? Math.max(Math.min(opts.readTimeout, MAX_READ_TIMEOUT), 0)
      : MIN_READ_TIMEOUT
    const readTimeout = setTimeout(cleanupStream.bind(null, key), readTimeoutMS)
    readTimeout.unref()
    streams[key] = { stream, readLength: 0, addedAt: Date.now(), endedAt: 0, readTimeout }
    return id
  },

  subscribe(rt: Runtime, id: number | string, cb: ivm.Reference<() => void>) {
    const key = streamKey(rt, id)
    log.debug("stream subscribe id:", id)
    const info = streams[key]
    if (!info) {
      return cb.applyIgnored(null, ["stream not found or destroyed after timeout"])
    }

    info.stream.once("close", function streamClose() {
      log.debug("stream closed, id:", id)
      try {
        cb.applyIgnored(null, ["close"])
      } catch (e) {
        // ignore
      }
      endStream(key, cb)
    })
    info.stream.once("end", function streamEnd() {
      log.debug("stream ended, id:", id)
      try {
        cb.applyIgnored(null, ["end"])
      } catch (e) {
        // ignore
      }
      endStream(key, cb)
    })
    info.stream.on("error", function streamError(err: Error) {
      log.debug("stream error, id:", id, err)
      try {
        cb.applyIgnored(null, ["error", err.toString()])
      } catch (e) {
        // ignore
      }
      endStream(key, cb)
    })
  },

  read(rt: Runtime, id: number | string, cb: ivm.Reference<() => void>) {
    const key = streamKey(rt, id)
    log.debug("stream:read id:", id)
    const info = streams[key]
    if (!info) {
      return cb.applyIgnored(null, ["stream closed, not found or destroyed after timeout"])
    }

    clearTimeout(info.readTimeout)
    let attempts = 0

    setImmediate(tryRead)
    function tryRead() {
      attempts += 1
      try {
        const chunk = info.stream.read()
        log.debug("chunk is null? arraybuffer?", !chunk, chunk instanceof Buffer)

        if (chunk) {
          info.readLength += Buffer.byteLength(chunk)
        }

        if (!chunk && !info.endedAt && attempts < 10) {
          // no chunk, not ended, attemptable
          setTimeout(tryRead, 20 * attempts)
          return
        }

        if (!chunk && attempts >= 10) {
          cb.applyIgnored(null, [null, null])
        } else if (chunk instanceof Buffer) {
          // got a buffer
          cb.applyIgnored(null, [null, transferInto(chunk)])
        }
        // got something else
        else {
          cb.applyIgnored(null, [null, chunk])
        }
        try {
          cb.release()
        } catch (e) {
          // ignore
        }
      } catch (e) {
        cb.applyIgnored(null, [e.message])
        try {
          cb.release()
        } catch (e) {
          // ignore
        }
      }
    }
  },
  pipe(rt: Runtime, id: number | string, dst: Writable) {
    const key = streamKey(rt, id)
    log.debug("stream:pipe id:", id)
    const info = streams[key]
    if (!info) {
      throw new Error("stream closed, not found or destroyed")
    }
    info.stream.pipe(dst)
  },

  tee(rt: Runtime, id: number | string): [number, number] {
    const key = streamKey(rt, id)
    const info = streams[key]
    if (!info) {
      throw new Error("stream closed, not found or destroyed")
    }

    const stream1 = new PassThrough()
    const stream2 = new PassThrough()

    const stream1Id = this.add(rt, stream1)
    const stream2Id = this.add(rt, stream2)

    info.stream.pipe(stream1)
    info.stream.pipe(stream2)

    return [stream1Id, stream2Id]
  },
  write(rt: Runtime, id: number | string, chunk: any): void {
    const key = streamKey(rt, id)
    const info = streams[key]
    if (!info) {
      throw new Error("stream closed, not found or destroyed")
    }
    if (info.stream instanceof Writable) {
      info.stream.write(chunk)
    } else {
      throw new Error("Stream cannot be written to")
    }
  },
  end(rt: Runtime, id: number | string, chunk: any): void {
    const key = streamKey(rt, id)
    const info = streams[key]
    if (!info) {
      throw new Error("stream closed, not found or destroyed")
    }
    if (info.stream instanceof Writable) {
      //@ts-ignore
      setImmediate(() => info.stream.end(chunk))
    } else {
      throw new Error("Stream cannot be written to")
    }
  }
}

registerBridge("stream.create", rt => {
  const stream = new PassThrough()
  return Promise.resolve(streamManager.add(rt, stream))
})

registerBridge("stream.push", (rt, _, id: number | string, chunk: any) => {
  return Promise.resolve(streamManager.write(rt, id, chunk))
})

registerBridge("stream.end", (rt, _, id: number | string, chunk: any) => {
  try {
    streamManager.end(rt, id, chunk)
  } catch (err) {
    console.error("stream end failed:", err)
  }
  return Promise.resolve(true)
})

function streamKey(rt: Runtime, id: number | string) {
  return `${rt.app.name}:${id}`
}

function generateStreamId(): number {
  return ++lastStreamId
}

function cleanupStream(key: string) {
  const info = streams[key]
  if (!info) {
    return
  }

  removeStream(key)
  try {
    info.stream.destroy()
  } catch (e) {
    // ignore
  }
}

function endStream(key: string, cb?: ivm.Reference<() => void>) {
  const info = streams[key]
  if (!info) {
    return
  }

  clearTimeout(info.readTimeout)
  info.endedAt = Date.now()
  if (cb) {
    try {
      cb.release()
    } catch (e) {
      // ignore
    }
  }
  removeStream(key)
}

function removeStream(key: string) {
  const info = streams[key]
  if (!info) {
    return
  }

  info.stream.removeAllListeners()
  delete streams[key]
}
