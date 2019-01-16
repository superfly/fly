import { expect } from "chai"

describe("URL", () => {
  it("ensures pathname begins with a slash", () => {
    const url = new URL("https://fly.io/about")
    url.pathname = "team"
    expect(url.pathname).to.equal("/team")
  })

  it("resolves a relative path from a base", () => {
    const url = new URL("fly", new URL("https://github.com/superfly/"))
    expect(url.pathname).to.equal("/superfly/fly")
  })

  it("resolves an absolte path from a base", () => {
    const url = new URL("/about", new URL("https://fly.io/path/"))
    expect(url.pathname).to.equal("/about")
  })

  it("inserts trailing slash if needed", () => {
    const url = new URL("fly", new URL("https://github.com/superfly"))
    expect(url.pathname).to.equal("/superfly/fly")
  })

  it("doesn't double encode % in pathname", () => {
    const url = new URL("https://fly.io")
    url.pathname = "encoded%20space"
    expect(url.pathname).to.equal("/encoded%20space")
  })
})
