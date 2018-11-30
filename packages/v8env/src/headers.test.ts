/**
 * @module fetch
 * @ignore
 */
import { FlyHeaders } from "./headers"

describe("Constructor", () => {
  test("with no arguments", () => {
    const h = new FlyHeaders()
    expect([...h.keys()]).toEqual([])
    expect([...h.values()]).toEqual([])
  })

  test("with object", () => {
    const h = new FlyHeaders({ a: "1", b: "2" })
    expect([...h.keys()]).toEqual(["a", "b"])
    expect([...h.values()]).toEqual(["1", "2"])
  })

  test("with array of string tuples", () => {
    const h = new FlyHeaders([["a", "1"], ["b", "2"]])
    expect([...h.keys()]).toEqual(["a", "b"])
    expect([...h.values()]).toEqual(["1", "2"])
  })

  test("with Headers instance", () => {
    const first = new FlyHeaders({ a: "1", b: "2" })
    const h = new FlyHeaders(first)
    expect([...h.keys()]).toEqual(["a", "b"])
    expect([...h.values()]).toEqual(["1", "2"])
  })
})

describe("append()", () => {
  test("combines a multi-value", () => {
    const h = new FlyHeaders()
    h.append("a", "1")
    h.append("a", "2")
    expect([...h.values()]).toEqual(["1, 2"])
  })

  test("ignores case", () => {
    const h = new FlyHeaders()
    h.append("a", "1")
    h.append("A", "2")
    expect([...h.values()]).toEqual(["1, 2"])
  })
})

describe("set()", () => {
  test("sets a value", () => {
    const h = new FlyHeaders({ a: "1, 2" })
    h.set("b", "1")
    expect([...h.values()]).toEqual(["1, 2", "1"])
  })

  test("overwrites a value", () => {
    const h = new FlyHeaders({ a: "1, 2" })
    h.set("a", "1")
    expect([...h.values()]).toEqual(["1"])
  })

  test("ignores case", () => {
    const h = new FlyHeaders({ a: "1, 2" })
    h.set("A", "1")
    expect([...h.values()]).toEqual(["1"])
  })
})

describe("delete()", () => {
  test("deletes a value", () => {
    const h = new FlyHeaders({ a: "1, 2" })
    h.delete("a")
    expect([...h.values()]).toEqual([])
  })

  test("no-op if key not found", () => {
    const h = new FlyHeaders({ a: "1" })
    h.delete("b")
    expect([...h.values()]).toEqual(["1"])
  })

  test("ignores case", () => {
    const h = new FlyHeaders({ a: "1, 2" })
    h.delete("A")
    expect([...h.values()]).toEqual([])
  })
})

describe("get()", () => {
  test("returns a single value", () => {
    const h = new FlyHeaders({ a: "1", b: "2" })
    expect(h.get("a")).toEqual("1")
  })

  test("returns a multi-value", () => {
    const h = new FlyHeaders({ a: "1", b: "1, 2" })
    expect(h.get("b")).toEqual("1, 2")
  })

  test("ignores case", () => {
    const h = new FlyHeaders({ a: "1", b: "2" })
    expect(h.get("A")).toEqual("1")
  })

  test("returns null for a missing key", () => {
    const h = new FlyHeaders({ a: "1", b: "2" })
    expect(h.get("nope")).toBeNull()
  })
})

test("keys()", () => {
  const headers = new FlyHeaders({ a: "1", b: "2" })
  expect([...headers.keys()]).toEqual(["a", "b"])
})

test("values()", () => {
  const headers = new FlyHeaders({ a: "1", b: "2" })
  expect([...headers.values()]).toEqual(["1", "2"])
})

test("entries()", () => {
  const headers = new FlyHeaders({ a: "1", b: "2" })
  expect([...headers.entries()]).toEqual([["a", "1"], ["b", "2"]])
})

test("iterator", () => {
  const first = new FlyHeaders({ a: "1", b: "2" })
  const names: string[] = []
  const values: string[] = []
  for (const [name, value] of first) {
    names.push(name)
    values.push(value)
  }
  expect(names).toEqual(["a", "b"])
  expect(values).toEqual(["1", "2"])
})
