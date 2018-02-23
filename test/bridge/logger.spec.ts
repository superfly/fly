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
      const [msg, res] = await Promise.all([
        new Promise((resolve) => {
          this.udpServer.once('message', (message: Buffer) => resolve(message))
        }),
        axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })
      ])

      expect(res.status).to.equal(200)
      expect(msg.toString()).to.include("info: yo")
    })

  })
})