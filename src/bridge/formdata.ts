import * as multiparty from 'multiparty'
import { ivm, Context } from '../'
import * as http from 'http'
import log from '../log'

import { registerBridge } from './'

registerBridge('parseFormData', function (ctx: Context) {
  return function (proxy: ivm.Reference<http.IncomingMessage>, cb: ivm.Reference<Function>) {
    let req = proxy.deref()
    let form = new multiparty.Form()

    form.on("error", (err) => { cb.apply(null, ["error", err.toString()]) })
    // Parts are emitted when parsing the form
    form.on('part', function (part: multiparty.Part) {
      // You *must* act on the part by reading it
      // NOTE: if you want to ignore it, just call "part.resume()"

      if (part.filename) {
        part.resume()
        return
      }

      let readDone = false

      part.on('error', (err) => {
        readDone = true
        cb.apply(null, ["error", err.toString()])
      });
      part.on("end", () => { readDone = true })
      part.on("close", () => { readDone = true })

      part.on("readable", () => {
        let value = ""
        do {
          let read = part.read()
          log.debug("read stuff", typeof read, read instanceof Buffer)
          if (!read)
            break
          value += read.toString()
          log.debug("read:", value)
          cb.apply(undefined, ["part", part.name, value])
        } while (!readDone)
      });
    })

    // Close emitted after form parsed
    form.on('close', function () {
      cb.apply(null, ["close"])
    });

    setImmediate(() => { form.parse(req) })
  }
})