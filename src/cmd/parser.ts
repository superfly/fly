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
    if (argv.indexOf('--help') >= 0 || argv.indexOf('-h') >= 0) {
      this.displayHelp()
      return {}
    }

    let argPos = 2
    this.found = {}
    let command = null
    while (argPos < argv.length) {
      for (let i = 0; i < this.objs.length; i++) {
        console.log('found: ', this.found)
        console.log('working on', this.objs[i].name)
        console.log('for arg', argv[argPos])
        if (argPos >= argv.length) {
          console.log("ending on", argv[argPos], argPos)
          if (command) command()
          return this.found
        }
        if (this.equalsName(argv[argPos], this.objs[i], this.objs[i].type === COMMAND)) {
          if (this.objs[i].type === COMMAND) {
            if (exicute && this.objs[i].action) command = this.objs[i].action
          } else {
            argPos++
            this.found[this.objs[i].name] = argv[argPos]
          }
          argPos++
        }
      }
    }

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
