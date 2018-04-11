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
  * @property dontShow [optional] does not show this option or command in usage/help
  * @property showParams [optional] displays this as parameters the option can take
  * @property respondsTo [optional] this option will only be set if the command it responds to is also set
  */
  add(obj:any[]) {
    this.objs = [...this.objs, ...obj]
  }

  getOptions (exicute:boolean = false, reset:boolean = false):any {
    if (reset) this.found = null
    if (this.found) return this.found

    const argv = this.argv || process.argv
    if (argv.indexOf('--help') >= 0 || argv.indexOf('-h') >= 0 || argv.length < 3) {
      if (argv.length < 4) this.displayHelp()
      else this.displayHelpFor(this.objs.filter((item) => item.name === argv[2])[0])
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
          this.throwIf(command, option)
          this.found[option.mapTo || option.name] = argv[argPos]
        }
        if (option.type == COMMAND) command = option
        if (option.bool) {
          this.found[option.mapTo || option.name] = true
          this.throwIf(command, option)
        }
        argPos++
      } else {
        throw Error ('could not find option: ' + argv[argPos])
      }
    }

    if (exicute && command) command.action()
    return this.found
  }

  private throwIf(command:any, option:any) {
    if (
      command &&
      option.respondsTo &&
      !this.respondsTo(option.respondsTo, command.name)
    ) throw Error (`Option ${option.name} does not work with command ${command.name}`)
  }

  private respondsTo(option:string | string[], name:string) {
    if (option.length) return option.indexOf(name) > -1
    return option === name
  }

  private equalsName(name:string, obj:any, isCommand:boolean) {
    if (isCommand && name === obj.name) return true
    if (name === '--' + obj.name) return true
    if (name === '-' + obj.name.charAt(0)) return true
    return false
  }

  private displayHelpFor (command:any) {
    console.log(command.description, '\n')
    if (command.useage) console.log('\t Usage: ', command.usage, '\n')
    console.log('\t Options: \n')
    this.objs.forEach((obj) => {
      if (obj.respondsTo && this.respondsTo(obj.respondsTo, command.name)) {
        if (obj.type === COMMAND) this.showCommand(obj)
        if (obj.type === OPTION) this.showOption(obj)
      }
    })
  }

  private displayHelp () {
    console.log(this.description, '\n')
    console.log('\t Usage: ', this.usage, '\n')
    console.log('\t Commands: \n')
    this.objs.forEach((obj) => {
      if (obj.type === COMMAND && !obj.dontShow) this.showCommand(obj)
    })
    console.log('\n\t Options: \n')
    this.objs.forEach((obj) => {
      if (obj.type === OPTION && !obj.dontShow) this.showOption(obj)
    })
  }

  private showOption(obj:any) {
    console.log(`\t - ${obj.name} (${'--' + obj.name}, ${'-' + obj.name.charAt(0)}) ${obj.showParams || ''}: ${obj.description || ''}`)
    if (obj.useage) console.log(`\t \t Usage: ${obj.useage}`)
  }

  private showCommand(obj:any) {
    console.log(`\t - ${obj.name}: ${obj.description || ''}`)
    if (obj.useage) console.log(`\t \t Usage: ${obj.useage}`)
  }
}

export default Parser
