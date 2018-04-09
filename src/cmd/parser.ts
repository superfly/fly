import { COMMAND } from './argTypes'

interface Parser {
  description: string,
  objs: any[],
  found: any
}

class Parser {
  constructor (description:string, obj:any[]) {
    this.description = description
    this.objs = obj
  }

  add(obj:any[]) {
    this.objs = [...this.objs, ...obj]
  }

  getOptions (exicute?:boolean):any {
    if (this.found) return this.found

    const argv = process.argv
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
        console.log('looking for', argv[argPos])
        console.log('looking on option', this.objs[i].name)
        if (this.equalsName(argv[argPos], this.objs[i], this.objs[i].type === COMMAND)) {
          option = this.objs[i]
          console.log('found option', option)
          break
        }
      }
      if (option) {
        if (option.type !== COMMAND ||
          (option.takesArguments && argv[argPos+1].charAt(0) !== '-') // This is for commands like set that *might* take a value, but might also use another option to get that value
        ) {
          argPos++
          this.found[option.mapTo || option.name] = argv[argPos]
        }
        if (exicute && option.action) command = option.action
        argPos++
      } else {
        throw Error ('could not find option: ' + argv[argPos])
      }
    }
    console.log('found', this.found)
    //we should never get here, but better safe than sorry
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
    console.log('help')
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
