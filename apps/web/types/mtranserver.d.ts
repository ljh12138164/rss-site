// v4.0.33 publishes declarations with unresolved `@/` aliases, so keep the used API local.
declare module 'mtranserver' {
  interface MTranConfig {
    configDir?: string
    modelDir?: string
    cacheSize?: number
    checkUpdate?: boolean
    logConsole?: boolean
    logToFile?: boolean
    workerIdleTimeout?: number
  }

  export class MTran {
    constructor(config?: MTranConfig)
    init(): Promise<void>
    translate(from: string, to: string, text: string, html?: boolean): Promise<string>
    downloadModel(from: string, to: string): Promise<void>
    close(): Promise<void>
  }
}
