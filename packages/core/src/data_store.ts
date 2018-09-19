import { Runtime } from "./runtime"

export interface DataStore {
  collection(rt: Runtime, name: string): Promise<CollectionStore>
  dropCollection(rt: Runtime, name: string): Promise<void>
}

export interface CollectionItem {
  obj: any
}

export interface CollectionStore {
  put(rt: Runtime, key: string, obj: string): Promise<boolean>
  get(rt: Runtime, key: string): Promise<CollectionItem>
  del(rt: Runtime, key: string): Promise<boolean>
  getAll(rt: Runtime, prefix: string, opts: any): Promise<CollectionItem[]>
}
