import { AppConfig, Environment, TestContext } from "@fly/test-server";
import { RequestInit } from "node-fetch"

const jestGlobal: any = global;

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