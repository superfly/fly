import { App } from './'

export interface AppStore {
  getAppByHostname(hostname: string): Promise<App>;
}