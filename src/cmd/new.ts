import { root, CommonOptions, addCommonOptions, getAppName } from "./root"
import * as path from "path"
import * as fs from "fs"
import { sync as glob } from "glob"

export interface NewOptions {
    template: string[]
}
export interface NewArgs {
    name: string
}

const newCommand = root
    .subCommand<NewOptions, NewArgs>("new <name>")
    .description("Create a new Fly app.")
    .option("-t, --template [template]", "Name of the template to use. default: javascript-app", "javascript-app")
    .action((options, args) => {
        const templateName = options.template[0]
        const cwd = process.cwd()

        generate({
            cwd: cwd,
            appName: args.name,
            rootDir: path.resolve(cwd, args.name),
            templateName: templateName,
            templatePath: getTemplatePath(templateName)
        })
    })

interface GeneratorOptions {
    cwd: string,
    appName: string
    rootDir: string,
    templateName: string,
    templatePath: string
}

function getTemplatePath(templateName: string): string {
    return path.resolve(__dirname, "..", "..", "templates", templateName)
}

export class GeneratorError extends Error { }

function generate(options: GeneratorOptions) {
    checkTemplate(options)

    console.log(`Using template ${options.templateName}`)

    console.log(`Creating project in ${options.rootDir}...`)
    createOutputDirectory(options)
    copyTemplateToOutput(options)

    console.log(`Successfully created project ${options.appName}`)
    console.log(`Get started with the following commands:`)
    console.log(`  $ cd ${path.relative(options.cwd, options.rootDir)}`)
    console.log(`  $ fly server`)
}

function checkTemplate(options: GeneratorOptions) {
    if (!fs.existsSync(options.templatePath)) {
        throw new GeneratorError(`Invalid template '${options.templateName}'`)
    }
}

function createOutputDirectory(options: GeneratorOptions) {
    fs.mkdirSync(options.rootDir)
}

function copyTemplateToOutput(options: GeneratorOptions) {
    glob(path.join(options.templatePath, "**", "*")).forEach(inputPath => {
        const outputPath = translateOutputPath(inputPath, options)
        fs.copyFileSync(inputPath, outputPath)
    })
}

function translateOutputPath(templateFile: string, options: GeneratorOptions): string {
    var templateRelativePath = path.relative(options.templatePath, templateFile)
    return path.join(options.rootDir, templateRelativePath)
}
