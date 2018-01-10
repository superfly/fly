export let catalog = new Map<string, Function>()

export function add(name: string, fn: Function) {
  catalog.set(name, fn)
}