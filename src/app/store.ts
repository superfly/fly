import { App } from './'
import { Trace } from '../trace';

export interface AppStore {
  getAppByHostname(hostname: string, trace?: Trace): Promise<App | void>;
}