export interface DataStore {
  collection(name: string): Promise<CollectionStore>
  dropCollection(name: string): Promise<void>
}

export interface CollectionStore {
  put(key: string, obj: string): Promise<boolean>
  get(key: string): Promise<any>
  del(key: string): Promise<boolean>
}