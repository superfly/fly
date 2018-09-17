const baseConfig = require("../../scripts/jest/base_config.js")

const config = Object.assign({}, baseConfig, {
  "testEnvironment": "@fly/test-environment",
  "setupTestFrameworkScriptFile": "@fly/test-environment/install",
})

if (process.env.CI) {
  Object.assign(config, {
    "reporters": [
      ["jest-junit", {
        "output": "../../artifacts/edge-apps.junit.xml"
      }],
      "jest-silent-reporter"
    ]
  })
}

module.exports = config
