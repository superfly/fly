import { AppConfig, Environment, TestContext } from "@fly/test-server";

export async function setup(this: any) {
  console.log("global.setup")
}

export async function teardown(this: any) {
  console.log("global.teardown")
}

export function install(this: any) {
  console.log("global.install")
  console.log("global install", this)
  this.global.setupApps = (appConfig: AppConfig) => {
    console.log("FlyEnvironment.setup")
    let testServer: Environment
    let testContext: TestContext

    beforeEach(async () => {
      console.log("FlyEnvironment.setup.beforeEach")
      const servers = Object.entries(appConfig).map(val => ({ host: val[0], path: val[0] }))
      testServer = new Environment({
        testDir: __dirname,
        "testName": "test name",
        servers
      })
      await testServer.start()
      testContext = new TestContext(testServer)
      this.global.fetch = testContext.fetch
    })

    afterEach(async () => {
      console.log("FlyEnvironment.setup.afterEach")
      // const env = testGlobal["testServer"]
      if (!testServer) {
        console.warn("No test server to stop...")
        // } else if (!isEnvironment(env)) {
        //   console.warn("env is wrong type", env)
      }

      await testServer.stop()
      this.global.fetch = undefined
    })
  }
}
