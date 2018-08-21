declare var bridge: any

export async function del(key: string): Promise<boolean> {
  return new Promise<boolean>(function globalDelPromise(resolve, reject) {
    bridge.dispatch("flyCacheNotifierDel", key, function globalDelCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

export default {
  del
}