import axios from 'axios'
const { buildApp } = require('../utils/build')

const flyEndpoint = process.env.FLY_BASE_URL || "https://fly.io"

module.exports = async function deployApp(appID: string, token: string) {
  try{
    let res = await axios({
      method: 'get',
      url: `${flyEndpoint}/api/v1/sites/${appID}/script`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (res.status === 200) {
      console.log(res.data.script)
      process.exit(0)
    }
  }catch(err){
    console.error(err.message)
    process.exit(1)
  }
}