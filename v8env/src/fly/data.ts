export class Collection {
  name: string
  constructor(name: string) {
    this.name = name
  }

  put(key: string, obj: string) {
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

  get(key: string) {
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

  del(key: string) {
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

export default data;