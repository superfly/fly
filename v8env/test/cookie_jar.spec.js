import { expect } from 'chai'

describe("cookies", () => {
  it("gets cookie values", () => {
    const req = new Request("http://example.com", { headers: { cookie: 'foo=bar;hello=world;' } })
    const foo = req.cookies.get("foo").value
    const hello = req.cookies.get("hello").value
    const no = req.cookies.get("no").value

    expect(foo).to.eq("bar")
    expect(hello).to.eq("world")
    expect(no).to.eq(undefined)
  })

  it("creates right set-cookie header", () => {
    const resp = new Response("hello")
    resp.cookies.append("test1", "val1", { maxAge: 1000 })
    resp.cookies.append("test2", "val2")

    const setCookie = resp.headers.get("set-cookie")
    expect(setCookie).to.eq("test1=val1,test2=val2")
  })
})