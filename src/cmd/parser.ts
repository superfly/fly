import { COMMAND, OPTION } from './argTypes'

interface Parser {
  description: string,
  objs: any[],
  found: any,
  usage: string,
  argv: string[]
}

class Parser {
  constructor (description:string, usage:string, obj:any[]) {
    this.description = description
    this.objs = obj
    this.usage = usage
  }

  setArgs (args:string[]) {
    this.argv = args
  }

  /*
  * add takes an array of options. Options are objects in this format:
  * @property name [required] this is the name that can the user can type to get
                           this option or command. for commands the user can use
                           the name and for options the user can use either
                           --the-name or -the first letter of the name eg. name:
                           from-file will be triggered by: -f || --from-file
  * @property type [required] the type of option. this can be either COMMAND or OPTION
  * @property action [required (for commands)] the function to be run when a
                                            command is given by the user.
  * @property mapTo [optional] the name of the object returned from getOptions
  * @property description [optional] description of the command or option
  * @property usage [optional] the useage of a particular command or option
  * @property takesArguments [optional] allows commands to take arguments
  * @property bool [optional] makes the option not take any value
  */
  add(obj:any[]) {
    this.objs = [...this.objs, ...obj]
  }

  getOptions (exicute:boolean = false, reset:boolean = false):any {
    if (reset) this.found = null
    if (this.found) return this.found

    const argv = this.argv || process.argv
    if (argv.indexOf('--help') >= 0 || argv.indexOf('-h') >= 0 || argv.length < 3) {
      this.displayHelp()
      return {}
    }

    let argPos = 2
    this.found = {}
    let command = null

    while (argPos < argv.length) {
      let option
      for (let i = 0; i < this.objs.length; i++) {
        if (this.equalsName(argv[argPos], this.objs[i], this.objs[i].type === COMMAND)) {
          option = this.objs[i]
          break
        }
      }
      if (option) {
        if (
          (option.type !== COMMAND ||
          (option.takesArguments && argv[argPos+1].charAt(0) !== '-')) && // This is for commands like set that *might* take a value, but might also use another option to get that value
          !option.bool
        ) {
          argPos++
          this.found[option.mapTo || option.name] = argv[argPos]
        }
        if (exicute && option.action) command = option.action
        if (option.bool) this.found[option.mapTo || option.name] = true
        argPos++
      } else {
        throw Error ('could not find option: ' + argv[argPos])
      }
    }

    if (command) command()
    return this.found
  }

  private equalsName(name:string, obj:any, isCommand:boolean) {
    if (isCommand && name === obj.name) return true
    if (name === '--' + obj.name) return true
    if (name === '-' + obj.name.charAt(0)) return true
    return false
  }

  private displayHelp () {
    console.log(this.description, '\n')
    console.log('\t Usage: ', this.usage, '\n')
    console.log('\t Options: \n')
    this.objs.forEach((obj) => {
      if (obj.type === OPTION) this.showOption(obj)
    })
    console.log('\n\t Commands: \n')
    this.objs.forEach((obj) => {
      if (obj.type === COMMAND) this.showCommand(obj)
    })
  }

  private showOption(obj:any) {
    console.log(`\t - ${obj.name} (${'--' + obj.name}, ${'-' + obj.name.charAt(0)}): ${obj.description || ''}`)
    if (obj.useage) console.log(`\t \t Usage: ${obj.useage}`)
  }

  private showCommand(obj:any) {
    console.log(`\t - ${obj.name}: ${obj.description || ''}`)
    if (obj.useage) console.log(`\t \t Usage: ${obj.useage}`)
  }
}

export default Parser


// if (this.objs[i].accepts === 1) {
//   found[this.objs[i].name] = argv[argPos]
// } else {
//   found[this.objs[i].name] = []
//   while (argPos < argv.length && argv[argPos].charAt(0) !== '-') {
//     found[this.objs[i].name].push(argv[argPos])
//     argPos++
//   }
//   argPos--
// }
