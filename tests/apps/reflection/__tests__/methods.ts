import { Environment } from "@fly/pester"
import axios, { AxiosResponse } from 'axios'
import * as fs from "fs"
import * as path from "path"

function createEnv() {
    return new Environment({
        testName: "helloWorld",
        testDir: __dirname,
        servers: [
            {
                name: "app",
                path: path.resolve(__dirname, "../app.js")
            }
        ]
    })
}

test("handle GET requests", async () => {
    const env = createEnv()
    await env.start()

    const response = await env.fetch("http://app")
    const jsonBody = await response.json()

    expect(jsonBody).toMatchSnapshot()
    // expect(jsonBody).toMatchSnapshot({
    //     headers: {
    //         date: expect.any(String)
    //     }
    // })

    await env.stop()
})

test("handle PUT requests", async () => {
    const env = createEnv()
    await env.start()

    const response = await env.fetch("http://app", { method: "PUT" })
    const jsonBody = await response.json()

    expect(jsonBody).toMatchSnapshot()

    await env.stop()
})

