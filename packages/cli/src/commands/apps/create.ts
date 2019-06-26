import { FlyCommand } from "../../base-command"
import { processResponse } from "../../api"
import { isValidAppName, fullAppMatch } from "../../util"
import { existsSync, writeFileSync } from "fs"
import * as sharedFlags from "../../flags"
import { flags as cmdFlags } from "@oclif/parser"
import gql from "graphql-tag"
import inquirer = require("inquirer")
import { inspect } from "util"
import { cli } from "cli-ux"

export default class Create extends FlyCommand {
  static description = `create a new app`

  public static flags = {
    token: sharedFlags.apiToken(),
    app: sharedFlags.app(),
    container: cmdFlags.boolean({
      hidden: true
    })
  }

  public async run() {
    const { flags } = this.parse(Create)

    const client = this.gqlClient(flags)

    const orgResp = await client.query({
      query: LIST_ORGANIZATIONS
    })

    const organizations = orgResp.data.organizations.nodes.map((option: any) => (option.value = option.id) && option)

    const answers: any = await inquirer.prompt([
      {
        name: "name",
        message: "app name (leave blank to use a random name)",
        default: flags.app,
        validate: validateAppName
      },
      {
        name: "organizationId",
        message: "select an organization",
        type: "list",
        choices: organizations
      }
    ])

    cli.action.start("creating app")

    const resp = await client.mutate({
      mutation: CREATE_APP,
      variables: {
        input: { ...answers, runtime: flags.container ? "FIRECRACKER" : "NODEPROXY" }
      }
    })

    cli.action.stop()

    const newApp = resp.data.createApp.app
    const newAppName = newApp.name

    this.log(`Created a new app: ${newAppName}`)

    if (newApp.ip_addresses.nodes.length > 0) {
      this.log(`--> https://${newApp.ip_addresses.nodes[0].address}`)
    }

    console.log(inspect(resp, { showHidden: true, depth: 10, colors: true }))

    if (existsSync(".fly.yml")) {
      this.log(`Add it to your .fly.yml like: \`app: ${newAppName}\``)
    } else {
      writeFileSync(".fly.yml", `app: ${newAppName}`)
      this.log("Created a .fly.yml for you.")
    }
  }
}

function validateAppName(name?: string) {
  if (name && !isValidAppName(name)) {
    return `App name must match regex: ${fullAppMatch}`
  }
  return true
}

const LIST_ORGANIZATIONS = gql`
  {
    organizations {
      nodes {
        id
        slug
        name
        type
      }
    }
  }
`

const CREATE_APP = gql`
  mutation($input: CreateAppInput!) {
    createApp(input: $input) {
      app {
        id
        name
        runtime
        ip_addresses {
          nodes {
            address
          }
        }
      }
    }
  }
`
