import 'svelte'

import './assets'
import './modules'

declare global {
  interface ImportMetaEnv {
    readonly MODE: 'development' | 'production' | 'test' | string
    readonly NODE_ENV: 'development' | 'production' | 'test' | string
    readonly [key: string]: string | undefined
  }

  // Extensions import.meta
  interface ImportMeta {
    readonly resolve: (id: string, from?: string) => Promise<string>

    readonly hot?: {
      /**
       * This object is used to pass data between the old and new version of a module.
       *
       * On the first run of a module (i.e. initial load, not a HMR update), this object will be `undefined`
       */
      readonly data: Record<string, unknown> | undefined

      /**
       * The dispose function is called when the module is about to be replaced.
       *
       * The handler is passed a data object that you can mutate and that will be available to the
       * new version of the module that is being loaded.
       */

      readonly beforeUpdate: (callback: () => void | Promise<void>) => void

      /**
       * Accepts HMR updates for this module, optionally passing an accept handler.
       *
       * If a module has an accept handler, then changes to this module won't trigger a full reload.
       * If the module needs specific work to reflect the code change, it is expected to be handled
       * by the provided accept handler function.
       */
      readonly accept: (callback?: (args: { id: string, bubbled: boolean }) => void | Promise<void>) => void

      readonly dispose: (callback: (data: Record<string, unknown>) => void | Promise<void>) => void
      readonly afterUpdate: (callback: () => void | Promise<void>) => void
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
