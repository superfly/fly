import { root, CommonOptions, addCommonOptions, getAppName } from "./root"
import * as path from "path"
import * as fs from "fs"
import { sync as glob } from "glob"
import * as execa from "execa"
import { examplesPath } from "@fly/examples"

export interface NewOptions {
  template: string[]
  list: boolean
}
export interface NewArgs {
  name: string
}

const newCommand = root
  .subCommand<NewOptions, NewArgs>("new [name]")
  .description("Create a new Fly app.")
  .option("-t, --template [template]", "Name of the template to use. default: getting-started", "getting-started")
  .option("-l, --list", "List available templates.")
  .action(async (options, args) => {
    const templateIndex = new TemplateIndex([examplesPath])

    if (args.name === undefined || options.list) {
      listTemplates(templateIndex)
      return
    }

    const template = templateIndex.getTemplate(options.template[0])

    if (template == null) {
      console.warn(`The template '${options.template[0]}' could not be found`)
      console.log()
      listTemplates(templateIndex)
      return
    }

    const generator = new Generator({
      appName: args.name,
      template
    })

    console.log(`Using template ${generator.template.name}`)
    console.log(`Creating project in ${generator.rootDir}...`)

    try {
      generator.create()
    } catch (error) {
      console.warn("Failed to create app directory:")
      console.error(error)
      return
    }

    try {
      generator.copy()
    } catch (error) {
      console.warn("Failed to copy to app directory:")
      console.error(error)
      return
    }

    try {
      await generator.configure()
    } catch (error) {
      console.warn("Failed to configure:")
      console.error(error)
      return
    }

    console.log(`Successfully created project ${generator.appName}`)
    console.log(`Get started with the following commands:`)
    console.log(`  $ cd ${generator.relativePath()}`)
    console.log(`  $ fly server`)
  })

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

function listTemplates(index: TemplateIndex) {
  console.log("Start a new project with one of the following templates:")

  index.templates.forEach(template => {
    console.log(`  ${template.name}`)
  })

  console.log("Browse template source at https://github.com/superfly/fly/tree/master/examples")
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
