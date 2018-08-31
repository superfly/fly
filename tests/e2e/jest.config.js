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
  // "testEnvironment": "jest-environment-fly",
  "snapshotSerializers": [
    // "<rootDir>/packages/test-server/src/serializer.ts"
  ],
  "setupTestFrameworkScriptFile": "<rootDir>/tests/e2e/setup.ts",
  // "setupTestFrameworkScriptFile": "jest-environment-fly/install",
  // "globalSetup": "jest-environment-fly/setup",
  // "globalTeardown": "jest-environment-fly/teardown",
}