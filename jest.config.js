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
  "transform": {
    "\\.tsx?$": "ts-jest"
  },
  "testMatch": [
    "**/*\\.[tz]est\\.(ts|tsx)"
  ],
  "testEnvironment": "node",
  "roots": [
    "packages/"
  ],
  "reporters": [
    "default",
    ["jest-junit", {
      "output": "artifacts/junit.xml"
    }]
  ]
}