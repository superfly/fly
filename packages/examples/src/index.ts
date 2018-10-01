import * as path from "path"
import * as fs from "fs"

let examples = path.resolve(__dirname, "..", "apps")

// use examples from the repo root in dev
if (!fs.existsSync(examples)) {
  examples = path.resolve(__dirname, "..", "..", "..", "examples")
}

export const examplesPath = examples
