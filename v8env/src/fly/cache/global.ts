declare var bridge: any

export async function del(key: string): Promise<boolean> {
  return new Promise<boolean>(function globalDelPromise(resolve, reject) {
    bridge.dispatch("flyCacheNotify", "del", key, function globalDelCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

export async function purgeTag(key: string): Promise<boolean> {
  return new Promise<boolean>(function globalDelPromise(resolve, reject) {
    bridge.dispatch("flyCacheNotify", "purgeTag", key, function globalPurgeTagCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

export default {
  del,
  purgeTag
}