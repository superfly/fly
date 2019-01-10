declare interface Window {
  // fly global, exists on both rustproxy and nodeproxy
  fly?: any
  // rustproxy message api, undefined in nodeproxy
  libfly?: any
  // app release object in nodeproxy, undefined in rustproxy
  app?: any
}
