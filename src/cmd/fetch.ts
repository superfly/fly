import axios from 'axios'
const { buildApp } = require('../utils/build')

const flyEndpoint = process.env.FLY_BASE_URL || "https://fly.io"

module.exports = function deployApp(appID: string, token: string) {
  axios({
    method: 'get',
    url: `${flyEndpoint}/api/v1/sites/${appID}/script`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((res) => {
    if (res.status === 200) {
      console.log(res.data.script)
      process.exit(0)
    }
  })
}