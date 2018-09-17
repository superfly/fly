import { Runtime } from "./runtime"

export interface DataStore {
  collection(rt: Runtime, name: string): Promise<CollectionStore>
  dropCollection(rt: Runtime, name: string): Promise<void>
}

export interface CollectionStore {
  put(rt: Runtime, key: string, obj: string): Promise<boolean>
  get(rt: Runtime, key: string): Promise<any>
  del(rt: Runtime, key: string): Promise<boolean>
}
