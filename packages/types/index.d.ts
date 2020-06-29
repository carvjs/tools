import './assets'

declare global {
  // snowpack import.meta extensions
  interface ImportMeta {
    readonly hot?: {
      readonly accept: (callback?: (args: { module: unknown; deps: string[] }) => void) => void
      readonly dispose: (callback: () => void) => void
    }

    readonly env: {
      readonly MODE: 'development' | 'production' | 'test' | string
      readonly NODE_ENV: 'development' | 'production' | 'test' | string
      readonly [key: string]: string
    }
  }
}
