import * as React from 'react'

declare global {
  namespace React {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      class?: string
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      svelteself: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      sveltecomponent: {
        this: Svelte2TsxComponent
        [key: string]: unknown
      }
      sveltewindow: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      sveltehead: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      sveltebody: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      svelteoptions: {
        immutable?: boolean
        accessors?: boolean
        namespace?: string
        tag?: string
      }
    }
  }
}
