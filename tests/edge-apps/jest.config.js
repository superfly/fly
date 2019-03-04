const baseConfig = require("../../scripts/jest/base_config.js")

const config = Object.assign({}, baseConfig, {
  testEnvironment: "@fly/test-environment",
  setupFilesAfterEnv: ["@fly/test-environment/install"],
  testRunner: "jest-circus/runner"
})

if (process.env.CI) {
  Object.assign(config, {
    reporters: [
      [
        "jest-junit",
        {
          output: "../../artifacts/edge-apps.junit.xml"
        }
      ],
      [
        "jest-silent-reporter",
        {
          useDots: true
        }
      ]
    ]
  })
}

module.exports = config
