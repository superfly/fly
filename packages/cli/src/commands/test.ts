import { FlyCommand } from "../base-command"
import { TestRunner } from "../dev"

export default class Test extends FlyCommand {
  public static description = `run unit tests`

  public static flags = {}
  // env: sharedFlags.env()}

  public static examples = [
    "fly test test/**",
    "fly test __test__/test_file.ts",
    "fly test test/test_a.ts test/test_b.ts",
    "fly test test/these/** !but_not_this.js"
  ]

  // allow multiple path patterns
  static strict = false

  static args = [{ name: "pattern", description: "test file path pattern", default: TestRunner.defaultPattern }]

  public async run() {
    const { argv } = this.parse(Test)

    const runner = new TestRunner({ cwd: process.cwd(), paths: argv })

    const success = await runner.run()

    this.exit(success ? 0 : 1)
  }
}
