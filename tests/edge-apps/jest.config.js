module.exports = {
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "node"
  ],
  "moduleNameMapper": {
    "@fly/static": "<rootDir>/packages/v8env/src/fly/static.ts",
    "@fly/cache": "<rootDir>/packages/v8env/src/fly/cache/",
    "@fly/data": "<rootDir>/packages/v8env/src/fly/data.ts",
    "@fly/image": "<rootDir>/packages/v8env/src/fly/image/",
    "@fly/proxy": "<rootDir>/packages/v8env/src/fly/proxy",
    "@fly/fetch": "<rootDir>/packages/v8env/src/fly/fetch",
    "@fly/(.*)": "<rootDir>/packages/$1/src/index.ts"
  },
  "rootDir": "../../",
  "transform": {
    "\\.tsx?$": "ts-jest"
  },
  "testMatch": [
    "**/__tests__/**/*.ts?(x)",
    "**/*.(t|z)ests?.ts"
  ],
  "roots": [
    "<rootDir>/tests/edge-apps/"
  ],
  "testEnvironment": "@fly/test-environment",
  "setupTestFrameworkScriptFile": "@fly/test-environment/install",
  "reporters": ["default", "jest-junit"]
}