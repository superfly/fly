import { getPathKey } from "./util"
import { URL } from "url"

const pathKeyTests = [
  ["file://file.txt", "file.txt"],
  ["file://path/to/file.txt", "path/to/file.txt"],
  ["file:///leading/slash.txt", "/leading/slash.txt"],
  ["cache://with/querystring?a=1", "with/querystring?a=1"],
  ["cache://strip/trailing/qm?", "strip/trailing/qm"],
  ["cache://strip/trailing/slash/", "strip/trailing/slash"],
  ["cache://strip/trailing/slash/and/qm/?", "strip/trailing/slash/and/qm"]
]

test.each(pathKeyTests)("getPathKey(%s) == %s", (input, output) => {
  expect(getPathKey(new URL(input))).toEqual(output)
})
