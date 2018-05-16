import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'

describe('Glob', function () {
  before(startServer('fly-glob'))
  after(stopServer)

  describe('fetching *.jpg', function () {
    it('returns a 200 response', async () => {
      let res = await axios.get("http://127.0.0.1:3333/jpg.jpg")
      expect(res.status).to.equal(200)
    })
  })

  describe('fetching everything in public', function () {
    it('fetches first file', async () => {
      let res = await axios.get("http://127.0.0.1:3333/public/1.txt", { headers: { 'Host': "test" } })
      expect(res.status).to.equal(200)
      expect(res.data).to.equal("Hello\n")
    })

    it('fetches second file', async () => {
      let res = await axios.get("http://127.0.0.1:3333/public/2.txt", { headers: { 'Host': "test" } })
      expect(res.status).to.equal(200)
      expect(res.data).to.equal("World\n")
    })
  })
})
