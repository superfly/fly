import * as path from "path"

setupApps({
  "edge.test": path.resolve(__dirname, "proxy.js"),
  "origin.test": path.resolve(__dirname, "body.js")
})

const methods = ["POST"]
// const methods = ["POST", "PUT", "PATCH", "DELETE"]

test(
  "DO IT",
  done => {
    setTimeout(done, 60000)

    // const response = await fetch(`http://edge.test`, {
    //   method: "POST",
    //   body: "this is a body"
    // })
    // console.log("response", { response })
    // const body = await response.text()
    // expect(response.status).toEqual(200)
    // expect(body).toEqual("this is a body")
  },
  5 * 60 * 1000
)
// `from %s request`,
// async method => {
//   const response = await fetch(`http://${host}`, {
//     method: method,
//     body: "this is a body"
//   })
//   const body = await response.text()
//   console.log("response", { body })
//   expect(response.status).toEqual(200)
//   expect(body).toEqual("this is a body")
// },
// 5 * 60

// describe.each(["edge.test"])("Request body to %s", host => {
//   // test.only.each(methods)(
//   //   `from %s request`,
//   //   async method => {
//   //     const response = await fetch(`http://${host}`, {
//   //       method: method,
//   //       body: "this is a body"
//   //     })
//   //     const body = await response.text()
//   //     console.log("response", { body })
//   //     expect(response.status).toEqual(200)
//   //     expect(body).toEqual("this is a body")
//   //   },
//   //   5 * 60
//   // )

//   test("cloning", async () => {
//     const response = await fetch(`http://${host}/clone`, { method: "POST", body: "hello" })
//     const body = await response.text()
//     console.log("response", { body })
//     expect(response.status).toEqual(200)
//     expect(body).toEqual(`res1: hellohello\nres2: hellohello`)
//   })
// })
