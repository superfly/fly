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

  beforeEach(() => {
    return env.startContext().catch(fail)
  })

  afterEach(() => {
    return env.stopContext().catch(fail)
  })

  Object.assign(global, {
    setupApps: (apps: { [hostname: string]: string }) => {
      beforeAll(() => {
        env.pushApps(apps)
      })
      afterAll(() => {
        env.popApps(apps)
      })
    }
  })
}
