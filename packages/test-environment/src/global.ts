import JestEnvironment from "./JestEnvironment"

declare var env: JestEnvironment

export function install(this: any) {
  process.on("uncaughtException", error => {
    process.stderr.write(`Uncaught Exception: ${error} ${error.stack}`)
  })

  process.on("unhandledRejection", error => {
    process.stderr.write(`Unhandled Rejection: ${error} ${(error as any).stack}`)
  })

  Object.assign(global, {
    setupApps: (apps: { [hostname: string]: string }) => {
      env.pushApps(apps)

      beforeAll(done => {
        env
          .startContext()
          .then(done)
          .catch(done.fail)
      }, 60000)

      afterAll(done => {
        env
          .stopContext()
          .then(done)
          .catch(done.fail)
      })
    }
  })
}
