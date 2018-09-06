// import { AppConfig, Environment, TestContext } from "@fly/test-server";
// import { Server } from "@fly/core";
// import { RequestInit } from "node-fetch"

// const jestGlobal: any = global;

// process.on("uncaughtException", function (err) {
//   console.error("Uncaught Exception:", err, err.stack)
// })

// process.on("unhandledRejection", function (err) {
//   console.error("Unhandled Rejection:", err, err.stack)
// })

// this.fetch = function (url: string, init?: RequestInit) {
//   if (!this.testContext) {
//     fail("No servers configured, run setupApps first")
//     return
//   }

//   return this.testContext.fetch(url, init)
// }

// this.getServer = function (host: string): Server {
//   if (!this.testContext) {
//     fail("No servers configured, run setupApps first")
//     return
//   }

//   return this.testContext.getServer(host)
// }


// jestGlobal.setupApps = function (appConfig: AppConfig) {
//   if (this.flyContext) {
//     throw new Error("setupApps has already been called for this context")
//   }
//   // let testServer: Environment | undefined
//   // let testContext: TestContext | undefined

//   // this.fetch = (url: string, init?: RequestInit) => {
//   //   if (!testContext) {
//   //     fail("No servers configured, run setupApps first")
//   //     return
//   //   }

//   //   return testContext.fetch(url, init)
//   // }

//   // this.getServer = (host: string): Server => {
//   //   if (!testContext) {
//   //     fail("No servers configured, run setupApps first")
//   //     return
//   //   }

//   //   return testContext.getServer(host)
//   // }

//   beforeEach(async () => {
//     const servers = Object.entries(appConfig).map(([host, path]) => ({ host, path }))
//     this.testServer = new Environment({
//       testDir: __dirname,
//       "testName": "test name",
//       servers
//     })
//     this.testContext = new TestContext(this.testServer)
//     try {
//       console.log("setup before start")
//       await this.testServer.start()
//       console.log("setup after start")
//     } catch (error) {
//       console.log("setup [beforeAll]", error)
//     }
//   })

//   afterEach(async () => {
//     if (!this.testContext) {
//       console.warn("No test context found")
//     } else {
//       this.testContext = undefined
//     }
//     if (!this.testServer) {
//       console.warn("No test server to stop...")
//     } else {
//       await this.testServer.stop()
//       this.testServer = undefined
//     }

//     // this.fetch = undefined
//     // jestGlobal.getServer = undefined
//   })
// }