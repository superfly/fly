import { App, FileAppStore } from "../src"

describe("FileAppStore initialization", () => {
  test("invalid path", () => {
    expect(() => new FileAppStore({ appDir: "badpath", env: "test" })).toThrowError(/Could not find path/)
  })

  test("no code at path", async () => {
    expect(new FileAppStore({ appDir: __dirname, env: "test" }).build()).rejects.toMatch(/Entry module not found/i)
  })

  test("app with no config", () => {
    const store = new FileAppStore({ appDir: __dirname + "/fixtures/apps/no-config", env: "test" })
    expect(store.release.config).toEqual({})
  })

  test("secret interpolation", () => {
    const store = new FileAppStore({ appDir: __dirname + "/fixtures/apps/config-and-secrets", env: "test" })
    expect(new App(store.release).config).toEqual({
      option_a: "val_a",
      password: "sekret"
    })
  })

  test("picks config environment", () => {
    const store = new FileAppStore({
      appDir: __dirname + "/fixtures/apps/config-multi-env",
      env: "stage"
    })
    expect(store.release.app).toEqual("config-multi-env")
    expect(new App(store.release).config).toEqual({
      option_a: "val_a",
      password: "sekret"
    })
    expect(store.release.env).toEqual("stage")
  })
})
