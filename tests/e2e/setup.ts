import { AppConfig, Environment, TestContext } from "@fly/test-server";
import { Server } from "@fly/core";
import { RequestInit } from "node-fetch"

const jestGlobal: any = global;

process.on("uncaughtException", function (err) {
  console.error(err.stack)
})

process.on("unhandledRejection", function (err) {
  console.error(err.stack)
})

jestGlobal.setupApps = (appConfig: AppConfig) => {
  let testServer: Environment | undefined
  let testContext: TestContext | undefined

  jestGlobal.fetch = (url: string, init?: RequestInit) => {
    if (!testContext) {
      fail("No servers configured, run setupApps first")
      return
    }

    return testContext.fetch(url, init)
  }

  jestGlobal.getServer = (host: string): Server => {
    if (!testContext) {
      fail("No servers configured, run setupApps first")
      return
    }

    return testContext.getServer(host)
  }

  beforeAll(async () => {
    const servers = Object.entries(appConfig).map(([host, path]) => ({ host, path }))
    testServer = new Environment({
      testDir: __dirname,
      "testName": "test name",
      servers
    })
    testContext = new TestContext(testServer)
    await testServer.start()
  })

  afterAll(async () => {
    if (!testContext) {
      console.warn("No test context found")
    } else {
      testContext = undefined
    }
    if (!testServer) {
      console.warn("No test server to stop...")
    } else {
      await testServer.stop()
      testServer = undefined
    }
  })
}