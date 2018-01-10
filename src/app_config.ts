export class AppConfig {
  config: any
  code: string

  constructor(config: any) {
    this.config = config
  }

  getCode() {
    return this.code || this.config.script && this.config.script.content // legacy
  }

  getHostHeader(hostname: string): string {
    if (!this.config.hostnames)
      return ""
    for (let h of this.config.hostnames) {
      if (hostname == h.preview_hostname) {
        return h.hostname
      } else if (hostname == h.hostname) {
        return hostname
      }
    }
    return ""
  }
}