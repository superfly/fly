import { Environment, ServerOptions } from "./Environment"
import { TestContext } from "./TestContext";

export interface AppConfig {
  [name: string]: string
}

export type TestCallback = (ctx: TestContext) => Promise<void>

export async function runApps(apps: AppConfig, testCallback: TestCallback): Promise<void> {
  const servers: ServerOptions[] = []
  for (const [host, path] of Object.entries(apps)) {
    servers.push({
      host: host,
      path: path
    })
  }
  const env = new Environment({
    testDir: __dirname,
    "testName": "test name",
    servers
  })

  try {
    await env.start()
  } catch (error) {
    console.error("Error starting: ", error)
    fail(error)
    return
  }

  try {
    await testCallback(new TestContext(env))
  } catch (error) {
    console.error("Error testing: ", error)
    fail(error)
  } finally {
    try {
      await env.stop()
    } catch (error) {
      console.error("Error stopping: ", error)
      fail(error)
    }
  }
}
