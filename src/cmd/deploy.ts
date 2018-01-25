import axios from 'axios'
const { buildApp } = require('../utils/build')

const flyEndpoint = process.env.FLY_BASE_URL || "https://fly.io"

module.exports = function deployApp(appID: string, token: string) {
  buildApp(process.cwd(), { watch: false }, (err: Error, code: string) => {
    if (err) {
      throw err
    }

    axios({
      method: 'put',
      url: `${flyEndpoint}/api/v1/sites/${appID}/script`,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        script: code
      }
    }).then((res) => {
      if (res.status === 200 && res.data.meta.updated) {
        console.log("Successfully updated app on Fly.")
        process.exit(0)
      }
    }).catch((err) => {
      console.error(err.message)
      process.exit(1)
    })

  })
}