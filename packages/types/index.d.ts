import './assets'
import './modules'

declare global {
  interface ImportMetaEnv {
    readonly MODE: 'development' | 'production' | 'test' | string
    readonly NODE_ENV: 'development' | 'production' | 'test' | string
    readonly [key: string]: string | undefined
  }

  // snowpack import.meta extensions
  interface ImportMeta {
    readonly resolve: (id: string, from?: string) => Promise<string>

    readonly hot?: {
      readonly accept: (callback?: (args: { module: unknown; deps: string[] }) => void) => void
      readonly dispose: (callback: () => void) => void
    }

    readonly env: ImportMetaEnv
    readonly platform?: 'browser' | NodeJS.Platform
    readonly browser?: boolean
  }

  namespace NodeJS {
    interface Process {
      readonly browser?: boolean
    }
  }
}
