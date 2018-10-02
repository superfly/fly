const baseConfig = require("./scripts/jest/base_config.js")

const config = Object.assign({}, baseConfig, {
  "testEnvironment": "node",
  "roots": [
    "packages/"
  ]
})

if (process.env.CI) {
  Object.assign(config, {
    "reporters": [
      ["jest-junit", {
        "output": "./artifacts/packages.junit.xml"
      }],
      ["jest-silent-reporter", {
        "useDots": true
      }]
    ]
  })
}

module.exports = config
