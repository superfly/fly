import { expect } from 'chai'
import { startServer, cacheStore, stopServer } from './helper'
import axios from 'axios'

describe('Cache API', function () {
  before(startServer('fly-cache'))
  after(stopServer)

  it('sets a value', async () => {
    let path = "cache-api/" + Math.random().toString()
    let url = "http://test/" + path
    let res = await axios.get("http://127.0.0.1:3333/" + path, { headers: { 'Host': 'test' } })

    expect(res.status).to.equal(200)

    let cached = await cacheStore.get(`cache:test-app-id:${url}`)
    expect((<Buffer>cached).toString()).to.equal(url)
  })

  it('sets a ttl', async () => {
    let path = "cache-api/" + Math.random().toString()
    let url = "http://test/" + path
    let res = await axios.get("http://127.0.0.1:3333/" + path, { headers: { 'Host': 'test', 'TTL': 3600 } })

    expect(res.status).to.equal(200)

    let ttl = await cacheStore.ttl(`cache:test-app-id:${url}`)
    expect(ttl).to.equal(3600)
  })

  it('sets a yuge value', async () => {
    let path = "cache-api/yuge/" + Math.random().toString()
    let res = await axios.get("http://127.0.0.1:3333/" + path, { headers: { 'Host': 'test' } })
    expect(res.status).to.equal(500)
    expect(res.data).to.equal("Cache does not support values > 2MB")
  })

  it('gets a value', async () => {
    let data = "cached:" + Math.random().toString()
    await cacheStore.set("cache:test-app-id:http://test/cache-api/get", data)

    let res = await axios.get("http://127.0.0.1:3333/cache-api/get", { headers: { 'Host': 'test' } })
    expect(res.status).to.equal(200)
    expect(res.data).to.equal(data)
  })
})