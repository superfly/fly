// tslint:disable:no-shadowed-variable

import Command, { flags } from "@oclif/command"
import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"
import * as path from "path"
import * as fs from "fs"
import { sync as glob } from "glob"
import * as execa from "execa"
import { examplesPath } from "@fly/examples"
import { cli } from "cli-ux"
import * as inquirer from "inquirer"

export default class New extends FlyCommand {
  public static description = "create a new app"

  public static flags = {
    template: flags.string({
      char: "t",
      description: "the template to use"
    })
  }

  static args = [
    {
      name: "name",
      description: "app-name",
      required: true
    }
  ]

  public async run() {
    const { args, flags } = this.parse(New)
    const cwd = args.path || process.cwd()

    const templateIndex = new TemplateIndex([examplesPath])

    let templateName = flags.template

    if (!templateName) {
      const selectedTemplate: any = await inquirer.prompt([
        {
          name: "name",
          message: "select a template",
          type: "list",
          choices: templateIndex.templates,
          pageSize: 25
        }
      ])

      templateName = selectedTemplate.name
    }

    if (!templateName) {
      throw new Error("no template selected")
    }

    const template = templateIndex.getTemplate(templateName)

    if (!template) {
      throw new Error(`The template '${flags.template}' could not be found`)
    }

    const generator = new Generator({
      appName: args.name,
      template
    })

    console.log(`Using template ${generator.template.name}`)

    cli.action.start(`Creating project in ${generator.rootDir}`)

    generator.create()
    generator.copy()
    await generator.configure()

    cli.action.stop()

    console.log(`Successfully created project ${generator.appName}`)
    console.log(`Get started with the following commands:`)
    console.log(`  $ cd ${generator.relativePath()}`)
    console.log(`  $ fly server`)
  }
}

interface GeneratorOptions {
  appName: string
  path?: string
  template: TemplateInfo
}

interface TemplateInfo {
  name: string
  path: string
}

class TemplateIndex {
  public templates: TemplateInfo[] = []

  constructor(sources: string[]) {
    for (const source of sources) {
      this.addTemplates(source)
    }
  }

  public addTemplates(sourcePath: string) {
    for (const relPath of fs.readdirSync(sourcePath)) {
      const templatePath = path.join(sourcePath, relPath)
      if (!fs.lstatSync(templatePath).isDirectory) {
        continue
      }

      this.templates.push({
        name: path.basename(templatePath),
        path: templatePath
      })
    }
  }

  public getTemplate(name: string): TemplateInfo | undefined {
    return this.templates.find(ti => ti.name === name)
  }
}

export class GeneratorError extends Error {}

class Generator {
  public readonly cwd: string
  public readonly appName: string
  public readonly rootDir: string
  public readonly template: TemplateInfo

  constructor(options: GeneratorOptions) {
    this.cwd = process.cwd()
    this.appName = options.appName
    this.rootDir = options.path || path.resolve(this.cwd, this.appName)
    this.template = options.template
  }

  public relativePath() {
    return path.relative(this.cwd, this.rootDir)
  }

  public create() {
    fs.mkdirSync(this.rootDir)
  }

  public copy() {
    glob(path.join(this.template.path, "**", "*"), { dot: true }).forEach(templateFile => {
      const outputPath = this.translateTemplateFilePath(templateFile)
      fs.copyFileSync(templateFile, outputPath)
    })
  }

  public async configure() {
    const packageFile = path.join(this.rootDir, "package.json")
    if (!fs.existsSync(packageFile)) {
      return
    }

    const packageData = JSON.parse(fs.readFileSync(packageFile, "utf8"))
    packageData.name = this.appName
    fs.writeFileSync(packageFile, JSON.stringify(packageData), "utf8")

    console.log("Installing packages...")
    const exec = execa("npm", ["install"], { cwd: this.rootDir })
    exec.stdout.pipe(process.stdout)
    exec.stderr.pipe(process.stderr)

    await exec
  }

  private translateTemplateFilePath(inputPath: string): string {
    const templateRelativePath = path.relative(this.template.path, inputPath)
    return path.join(this.rootDir, templateRelativePath)
  }
}
