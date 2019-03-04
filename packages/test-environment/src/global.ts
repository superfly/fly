import JestEnvironment from "./JestEnvironment"

declare var env: JestEnvironment

export function install(this: any) {
  process.on("uncaughtException", error => {
    process.stderr.write(`Uncaught Exception: ${error} ${error.stack}`)
  })

  process.on("unhandledRejection", error => {
    process.stderr.write(`Unhandled Rejection: ${error} ${error.stack}`)
  })

  beforeEach(done => {
    env
      .startContext()
      .then(done)
      .catch(done.fail)
  }, 60000)

  afterEach(done => {
    env
      .stopContext()
      .then(done)
      .catch(done.fail)
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
