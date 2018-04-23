import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'
import { readFileSync } from 'fs'

describe('CSS Parser', function () {
	before(startServer('fly-css'))
	after(stopServer)
	it ('Only gets the CSS it needs', async () => {
		const res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" }});
		const correct = readFileSync(__dirname + '/fixtures/apps/fly-css/correct.css', 'binary')

		expect(res.data).to.equal(correct);
	})
})
