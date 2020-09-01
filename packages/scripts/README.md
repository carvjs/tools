# @carv/scripts

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Usage](#usage)
- [Features](#features)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

`package.json`:

```json
{
  "prettier": "@carv/prettier-config",
  "eslintConfig": {
    "extends": "@carv/eslint-config",
    "root": true
  },
  "jest": {
    "preset": "@carv/scripts"
  }
}
```

## Features

- Stylesheet combining
- Asset relocations
  - within javascript (`import './path/to/asset/style.css'` and `import pathToAsset from 'path/to/asset'`)
  - within stylesheets (`@import "path/to/style.css"`, `@import "~nodeModule/style.css"`, `url("path/to/asset")` and `url("~nodeModule/path/to/asset")`)
- Built-in support for the following file types, no configuration required:
  - JavaScript (`.js`, `.mjs`, `.cjs`)
  - TypeScript (`.ts, .tsx`)
  - JSX (`.jsx`, `.tsx`)
  - CSS (`.css`)
  - CSS Modules (`.module.css`)
  - SASS (`.scss`)
  - SASS Modules (`.module.scss`)
  - JSON (`.json`)
  - YAML (`.yaml`)
  - Assets (`.svg`, `.jpg`, `.png`, `.woff`, etc.)

### Import JSON

```js
// Returns the JSON object via the default import
import json from './data.json'
```

Importing JSON files is supported and returns the full JSON object in the default import.

### Import CSS

```js
// Loads './style.css' onto the page
import './style.css'
```

Basic CSS imports inside of JavaScript files is supported. When importing a CSS file via the import keyword, those style are automatically applyed to the page. This works for CSS and compile-to-CSS languages like Sass.

### Import CSS Modules

```css
/* src/style.module.css */
.error {
  background-color: red;
}
```

```jsx
// 1. Converts './style.module.css' classnames to unique, scoped values.
// 2. Returns an object mapping the original classnames to their final, scoped value.
import styles from './style.module.css'

// This example uses JSX, but you can use CSS Modules with any framework.
return <div className={styles.error}>Your Error Message</div>
```

CSS Modules are supported using the `[name].module.css` naming convention. CSS Modules work just like normal CSS imports, but with a special default styles export that maps the original classnames to unique identifiers.

### Import Images & Other Assets

```jsx
import img from './image.png' // img === '/src/image.png'
import svg from './image.svg' // svg === '/src/image.svg'

// This example uses JSX, but you can use these references with any framework.
;<img src={img} />
```

All other assets not explicitly mentioned above can be imported and will return a URL reference to the final built asset. This can be useful for referencing non-JS assets by URL, like creating an image element with a `src` attribute pointing to that image.

### Detect platform

The following expressions can be used to detect during the build time for which platform the current bundle is build:

For Node.JS bundles:

```js
process.browser === false
import.meta.browser === false

import.meta.platform === process.platform

import.meta.env.MODE === process.env.NODE_ENV
process.env.MODE === process.env.NODE_ENV

import.meta.env === process.env
```

For browser bundles:

```js
process.browser === true
import.meta.browser === true

process.platform === "browser"
import.meta.platform === "browser"

import.meta.env.MODE === (import.meta.env?.MODE || import.meta.env?.NODE_ENV))
process.env.MODE === (import.meta.env?.MODE || import.meta.env?.NODE_ENV))

// process.env and import.meta.env are set to an empty object
import.meta.env === {}
process.env === {}

process.versions.node === undefined
typeof process === "undefined"
```

### CSS Imports (@import)

```css
/* Import a local CSS file */
@import './style1.css';
/* Import a local Sass file */
@import './style2.scss';
/* Import a package CSS file */
@import 'bootstrap/dist/css/bootstrap.css';
/* Import a package CSS file */
@import '~bootstrap/dist/css/bootstrap.css';
/* Leave import as is */
@import url('bootstrap/dist/css/bootstrap.css');
```

[Native CSS “@import”](https://developer.mozilla.org/en-US/docs/Web/CSS/@import) is support with additional support for importing CSS from within packages.

Note: The actual CSS spec dictates that a “bare” import specifier like `@import "package/style.css"` should be treated as a relative path, equivalent to `@import "./package/style.css"`. We intentionally break from the spec to match the same package import behavior as JavaScript imports. If you prefer the strictly native behavior with no package resolution support, use the form `@import url("package/style.css")` instead. This will not resolve `url()` imports and will leave them as-is in the final build.

Additionally `~` imports (`@import '~package/...'`, URL starting with a tilde) to load a node module are supported.

Note: During bundling “bare” imports are re-written to use `~` import.

### SASS

The following include paths are search for imports:

- `./src/theme`
- `./src`
- project root
- `node_modules` (including all parent `node_modules`)

### Svelte

#### Postprocessing

- javascript and typescript via esbuild
- css via postcss with [nested](https://github.com/postcss/postcss-nested)
- scss via sass

### package.json

### Configuration fields

- `browser`: determines if this package maybe use in the browser
  - `false`: use eslint browser environment, build no browser variants
  - `true`: use eslint node environment, build no node variants
  - otherwise: use eslint shared-node-browser environment; build node & browser variants
- `exports`: additional exports; merged with the one below
- `sideEffects`: defaults to `false?`

#### Generated for publish

```json
{
  "//": "Modern declaration of which file should be used",
  "//": "see https://gist.github.com/sokra/e032a0f17c1721c71cfced6f14516c62",
  "exports": {
    "//": "Used when requesting 'package-name'",
    ".": {
      "//": "platform=node>=12.4"
      "node": {
        "require": "// target=es2019; svelte=dev:true",
        "default": "// wrapper for the cjs (require) variant",
      },
      "//": "platform=browser"
      "browser": {
        "esnext": "// target=esnext; svelte=dev:false; usedBy=@carv/cdn",
        "development": "// target=es2020; svelte=dev:true",
        "import": "// target=es2015; svelte=dev:false; usedBy=webpack,rollup,parcel",
        "script": "// umd; target=es2015; svelte=dev:false; usedBy=script",
      },
      "types": "// typescript definitions",
    },
    "//": "Used when requesting 'package-name/package.json' or 'package-name/assets/styles.css'",
    "//": "allow access to all files (including package.json, assets/, chunks/, ...)",
    "./": "./",
  },
  "//": "These fields are used when exports is not supported by the runtime/bundler",
  "//": "see https://github.com/stereobooster/package.json",
  "main": "// target=es2019; svelte=dev:true",
  "esnext": "// target=esnext; svelte=dev:false; usedBy=@carv/cdn",
  "module": "// target=es2015; svelte=dev:false; usedBy=webpack,rollup,parcel",
  "browser:module": "// target=es2020; svelte=dev:true; usedBy=snowpack",
  "unpkg": "// umd; target=es2015; svelte=dev:false; usedBy=script",
  "types": "// typescript definitions"
}
```

### Jest

The default `testEnvironment` is `jest-environment-jsdom-sixteen`. If the `package.json` field `browser` is `false` `jest-environment-node` is used.

To change the environment for a file use docblock pragma `@env` with either `node` or `jsdom`:

```js
/**
 * @env jsdom
 */
```

- `@carv/scripts/jest-preset.js`
- `jest.setup.js`
- Transforms
  - `*.svelte`
  - `*.module.(css|scss|less)` -> identity object proyy
  - `*.(css|scss|less|jpg|jpeg|png|gif|ico|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)` -> file basename
- test match
  - `src/**/__tests__/*.{js,jsx,ts,tsx`
  - `src/**/*.{spec,test}.{js,jsx,ts,tsx}`
