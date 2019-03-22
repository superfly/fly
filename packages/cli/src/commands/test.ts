// tslint:disable:no-shadowed-variable

import Command, { flags } from "@oclif/command"
import * as path from "path"
import * as fs from "fs"
import { spawn } from "child_process"
import { FileAppStore } from "@fly/core/lib/file_app_store"
import { Server } from "@fly/core/lib/server"
import { examplesPath } from "@fly/examples"
import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"

import { TestRunner } from "@fly/core/lib/test_runner"

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
    const { argv } = this.parse(this.ctor)

    console.log({ argv })

    const runner = new TestRunner({ paths: argv })

    const success = await runner.run()

    this.exit(success ? 0 : 1)
  }
}
