module.exports = {
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: ["**/*.test.ts?(x)", "**/tests/**/*.ts?(x)"],
  testPathIgnorePatterns: [".+\\.d\\.ts$"]
}
