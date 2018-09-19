/**
 * Persistent, global key/value data store. Open collections, write data with `put`. Then retrieve data with `get`.
 *
 * Keys and values are stored in range chunks. Chunks migrate to the region they're most frequently accessed from.
 * @module fly/data
 */
declare var bridge: any

/**
 * A collection of keys and values.
 */
export class Collection {
  public name: string

  /**
   * Opens a collection
   * @param name name of the collection to open
   */
  constructor(name: string) {
    this.name = name
  }

  /**
   * Stores data in the collection associated key
   * @param key key for data
   * @param obj value to store
   */
  public put(key: string, obj: string) {
    return new Promise((resolve, reject) => {
      try {
        bridge.dispatch("fly.Data.put", this.name, key, JSON.stringify(obj), (err: string | null, ok: boolean) => {
          if (err) {
            reject(new Error(err))
            return
          }
          resolve(ok)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Retrieves data from the collection store
   * @param key key to retrieve
   */
  public get(key: string) {
    return new Promise((resolve, reject) => {
      bridge.dispatch("fly.Data.get", this.name, key, (err: string | null, res: any) => {
        if (err) {
          reject(new Error(err))
          return
        }
        try {
          resolve(JSON.parse(res))
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  public getAll(prefix: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      bridge.dispatch("fly.Data.getAll", this.name, prefix, undefined, (err: string | null, ...res: any[]) => {
        if (err) {
          reject(new Error(err))
          return
        }
        try {
          resolve(res.map(r => (typeof r === "string" ? JSON.parse(r) : r)))
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  /**
   * Deletes data from the collection store.
   * @param key key to delete
   */
  public del(key: string) {
    return new Promise((resolve, reject) => {
      bridge.dispatch("fly.Data.del", this.name, key, (err: string | null, ok: boolean) => {
        if (err) {
          reject(new Error(err))
          return
        }
        resolve(ok)
      })
    })
  }
}

const data = {
  collection(name: string) {
    return new Collection(name)
  },
  dropCollection(name: string) {
    return new Promise((resolve, reject) => {
      bridge.dispatch("fly.Data.dropCollection", name, (err: string | null, ok: boolean) => {
        if (err) {
          reject(new Error(err))
          return
        }
        resolve(ok)
      })
    })
  }
}

export default data
