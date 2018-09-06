import JestEnvironment from "./JestEnvironment";

declare var env: JestEnvironment

export function install(this: any) {
  process.on("uncaughtException", function (error) {
    console.error("Uncaught Exception:", error, error.stack)
    fail(error)
  })

  process.on("unhandledRejection", function (error) {
    console.error("Unhandled Rejection:", error, error.stack)
    fail(error)
  })

  beforeEach(async () => {
    try {
      await env.startContext()
    } catch (error) {
      console.error("Error starting context", error)
      fail(error)
    }
  })

  afterEach(async () => {
    try {
      await env.stopContext()
    } catch (error) {
      console.error("Error stopping context", error)
      fail(error)
    }
  })

  Object.assign(global, {
    setupApps: (apps: { [hostname: string]: string }) => {
      beforeAll(() => {
        env.pushApps(apps)
      })
      afterAll(() => {
        env.popApps(apps)
      })
    },
  })
}
