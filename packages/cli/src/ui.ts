import { format } from "util"

export function PrintKVList(items: { [name: string]: any }) {
  // const maxLength = Math.max(...Object.keys(items).map(k => k.length))

  for (const [name, value] of Object.entries(items)) {
    console.log(`${name}: ${value}`)
  }
}
