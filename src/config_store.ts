import { AppConfig } from './app_config'

export interface ConfigStore {
  getConfigByHostname(hostname: string): Promise<AppConfig>;
}