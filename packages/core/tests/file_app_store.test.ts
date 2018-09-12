import { App, FileAppStore } from "../src";

describe.skip("FileAppStore initialization", () => {
  test("invalid path", () => {
    expect(() => new FileAppStore("badpath")).toThrowError(/Could not find path/)
  })

  test("no code at path", () => {
    expect(() => new FileAppStore(__dirname)).toThrowError(/no code/)
  })

  test("app with no config", () => {
    const store = new FileAppStore(__dirname + "/fixtures/apps/no-config", { noWatch: true })
    expect(store.release.config).toEqual({})
  })

  test("secret interpolation", () => {
    const store = new FileAppStore(__dirname + "/fixtures/apps/config-and-secrets", { noWatch: true })
    expect(new App(store.release).config).toEqual({
      "option_a": "val_a",
      "password": "sekret"
    })
  })

  test('picks config environment', () => {
    let store = new FileAppStore(__dirname + '/fixtures/apps/config-multi-env', { noWatch: true, env: 'stage' })
    expect(store.release.app).toEqual("config-multi-env")
    expect(new App(store.release).config).toEqual({
      "option_a": "val_a",
      "password": "sekret"
    })
    expect(store.release.env).toEqual("stage")
  })
})
