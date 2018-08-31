import { AppConfig, Environment, ServerOptions, TestContext } from "@fly/test-server";

const NodeEnvironment = require("jest-environment-node")

declare module NodeJS {
  interface Global {
    fetch: () => any
  }
}

class FlyEnvironment extends NodeEnvironment {
  constructor(config: any) {
    super(config)
  }

  setup() {
    console.log("FlyTestEnvironment.SETUP")
    console.log(new Date())
    this.global.msg = "HELLO"
    this.global.hello = function (message: string) {
      console.log("hello: " + message)
    }

    // beforeEach(() => console.log("HELLO FROM SETU{"))
    // const gbl = this.global
    // this.global.setupApps = (appConfig: AppConfig) => {
    //   console.log("SETUP APPS")
    //   return setup(appConfig)//  setup.bind(this, appConfig)()
    // }

    // this.global.setupApps = (appConfig: AppConfig) => {
    //   console.log("FlyEnvironment.setup")
    //   let testServer: Environment
    //   let testContext: TestContext

    //   beforeEach(async () => {
    //     console.log("FlyEnvironment.setup.beforeEach")
    //     const servers = Object.entries(appConfig).map(val => ({ host: val[0], path: val[0] }))
    //     testServer = new Environment({
    //       testDir: __dirname,
    //       "testName": "test name",
    //       servers
    //     })
    //     await testServer.start()
    //     testContext = new TestContext(testServer)
    //     this.global.fetch = testContext.fetch
    //   })

    //   afterEach(async () => {
    //     console.log("FlyEnvironment.setup.afterEach")
    //     // const env = testGlobal["testServer"]
    //     if (!testServer) {
    //       console.warn("No test server to stop...")
    //       // } else if (!isEnvironment(env)) {
    //       //   console.warn("env is wrong type", env)
    //     }

    //     await testServer.stop()
    //     this.global.fetch = undefined
    //   })
    // }
    return Promise.resolve()
  }

  teardown() {
    console.log("FlyTestEnvironment.Teardown")
    return Promise.resolve()
  }
}

// function setup(this: any, apps: AppConfig) {
//   console.log("FlyEnvironment.setup")
//   let testServer: Environment
//   let testContext: TestContext

//   beforeEach(async () => {
//     console.log("FlyEnvironment.setup.beforeEach")
//     const servers = Object.entries(apps).map(val => ({ host: val[0], path: val[0] }))
//     testServer = new Environment({
//       testDir: __dirname,
//       "testName": "test name",
//       servers
//     })
//     await testServer.start()
//     testContext = new TestContext(testServer)
//     this.global.fetch = testContext.fetch
//   })

//   afterEach(async () => {
//     console.log("FlyEnvironment.setup.afterEach")
//     // const env = testGlobal["testServer"]
//     if (!testServer) {
//       console.warn("No test server to stop...")
//       // } else if (!isEnvironment(env)) {
//       //   console.warn("env is wrong type", env)
//     }

//     await testServer.stop()
//     this.global.fetch = undefined
//   })
// }

// function setup2(apps: AppConfig) {
//   let testServer: Environment
//   let testContext: TestContext

//   beforeEach(this: any, async () => {
//     const servers = Object.entries(apps).map(val => ({ host: val[0], path: val[0] }))
//     testServer = new Environment({
//       testDir: __dirname,
//       "testName": "test name",
//       servers
//     })
//     // testGlobal["testServer"] = env
//     await testServer.start()
//     testContext = new TestContext(testServer);
//     (this as any).global.fetch = testContext.fetch
//     // (this as any).global.fetch = testContext.fetch
//     // testGlobal["testServerContext"] = context
//     // testGlobal["fetch"] = context.fetch
//   })

//   afterEach(async () => {
//     const env = testGlobal["testServer"]
//     if (!env) {
//       console.warn("No test environment to stop...")
//     } else if (!isEnvironment(env)) {
//       console.warn("env is wrong type", env)
//     }

//     await env.stop()
//   })
// }


// function setup(testGlobal: { [prop: string]: any }, apps: AppConfig) {
//   beforeEach(async () => {
//     const servers = Object.entries(apps).map(val => ({ host: val[0], path: val[0] }))
//     const env = new Environment({
//       testDir: __dirname,
//       "testName": "test name",
//       servers
//     })
//     testGlobal["testServer"] = env
//     await env.start()
//     const context = new TestContext(env)
//     testGlobal["testServerContext"] = context
//     testGlobal["fetch"] = context.fetch
//   })

//   afterEach(async () => {
//     const env = testGlobal["testServer"]
//     if (!env) {
//       console.warn("No test environment to stop...")
//     } else if (!isEnvironment(env)) {
//       console.warn("env is wrong type", env)
//     }

//     await env.stop()
//   })
// }

function isEnvironment(value: any): value is Environment {
  return value instanceof Environment
}

export default FlyEnvironment
