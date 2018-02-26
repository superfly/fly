import { expect } from 'chai'
import { startServer } from '../helper'
import axios, { AxiosResponse } from 'axios'
import { createSocket } from 'dgram';

describe('logger', () => {
  describe('syslog', () => {
    before(async function () {
      this.server = await startServer('bridge/logger/syslog.js')
      this.udpServer = await new Promise((resolve, reject) => {
        const socket = createSocket('udp4');
        socket.unref()
        socket.bind(3334, "127.0.0.1", () => resolve(socket))
      })
    })

    after(async function () {
      await Promise.all([
        new Promise((resolve) => { this.server.close(resolve) }),
        new Promise((resolve) => { this.udpServer.close(resolve) })
      ])
    })

    it('send a datagram to the defined syslog server', async function () {
      let msgs: Buffer[] = []
      this.udpServer.on('message', (message: Buffer) => {
        msgs.push(message)
      })

      const res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })

      expect(res.status).to.equal(200)

      const msg1Str: string = msgs[0].toString()
      expect(msg1Str).to.include("info: yo")
      expect(msg1Str).to.include("method=GET")
      expect(msg1Str).to.include("hello=world")

      const msg2Str: string = msgs[1].toString()
      expect(msg2Str).to.include("debug: debug test")
      expect(msg2Str).to.include("method=GET")
      expect(msg2Str).to.include("foo=bar")
      expect(msg2Str).to.include("hello=notworld")

      const msg3Str: string = msgs[2].toString()
      expect(msg3Str).to.include("error: Error: oh no")
      // sourcemap
      expect(msg3Str).to.include("(v8env/events.js")
      expect(msg2Str).to.include("method=GET")
      expect(msg2Str).to.include("foo=bar")
    })

  })
})