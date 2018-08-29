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
  console.log("Test starting...")

  try {
    console.log("Starting...")
    await env.start()
    console.log("Started.")
  } catch (error) {
    console.error("Error starting: ", error)
    fail(error)
    return
  }

  try {
    console.log("Testing...")
    await testCallback(new TestContext(env))
    console.log("Testing done...")
  } catch (error) {
    console.error("Error testing: ", error)
    fail(error)
  } finally {
    try {
      console.log("Stopping...")
      await env.stop()
      console.log("Stopped")
    } catch (error) {
      console.error("Error stopping: ", error)
    }
  }

  console.log("Test done...")
}
