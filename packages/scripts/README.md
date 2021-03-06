# @carv/scripts

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Usage](#usage)
- [Features](#features)
- [Configuration](#configuration)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

`package.json`:

```json
{
  "main": "src/index.ts",
  "prettier": "@carv/prettier-config",
  "eslintConfig": {
    "extends": "@carv/eslint-config",
    "root": true
  },
  "jest": {
    "preset": "@carv/scripts"
  },
  "carv": {
    "alias": {
      "@": "./src"
    }
  }
}
```

`tsconfig.json`:

```json
{
  "$schema": "http://json.schemastore.org/tsconfig",
  "extends": "./node_modules/@carv/scripts/tsconfig-preset.json",
  "include": ["src"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@": ["src"],
      "@/*": ["src/*"]
    }
  }
}
```

## Features

- Built-in support for the following file types, no configuration required:
  - JavaScript (`.js`, `.mjs`, `.cjs`)
  - TypeScript (`.ts, .tsx`)
  - JSX (`.jsx`, `.tsx`)
  - CSS (`.css`)
  - CSS Modules (`.module.css`)
  - SASS (`.scss`)
  - SASS Modules (`.module.scss`)
  - JSON (`.json`)
  - Assets (`.svg`, `.jpg`, `.png`, `.woff`, etc.)
- Stylesheet combining
- Asset relocations
  - within javascript (`import './path/to/asset/style.css'` and `import pathToAsset from 'path/to/asset'`)
  - within stylesheets (`@import "path/to/style.css"`, `@import "~nodeModule/style.css"`, `url("path/to/asset")` and `url("~nodeModule/path/to/asset")`)

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

### Dynamic Import Variables

Dynamic import variables are supported using [@rollup/plugin-dynamic-import-vars](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars).

When a dynamic import contains a concatenated string, the variables of the string are replaced with a glob pattern. This glob pattern is evaluated during the build, and any files found are added to the rollup bundle. At runtime, the correct import is returned for the full concatenated string.

Code that looks like this:

```js
function importLocale(locale) {
  return import(`./locales/${locale}.js`)
}
```

Is turned into:

```js
function __variableDynamicImportRuntime__(path) {
  switch (path) {
    case './locales/en-GB.js':
      return import('./locales/en-GB.js')
    case './locales/en-US.js':
      return import('./locales/en-US.js')
    case './locales/nl-NL.js':
      return import('./locales/nl-NL.js')
    default:
      throw new Error('Unknown variable dynamic import: ' + path)
  }
}

function importLocale(locale) {
  return __variableDynamicImportRuntime__(`./locales/${locale}.js`)
}
```

To know what to inject in the rollup bundle, we have to be able to do some static analysis on the code and make some assumptions about the possible imports. For example, if you use just a variable you could in theory import anything from your entire file system.

To help static analysis, and to avoid possible foot guns, we are limited to a [couple of rules](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations):

- [Imports must start with `./` or `../`](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#imports-must-start-with--or-)
- [Imports must end with a file extension](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#imports-must-end-with-a-file-extension)
- [Imports to your own directory must specify a filename pattern](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#imports-to-your-own-directory-must-specify-a-filename-pattern)
- [Globs only go one level deep](https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#globs-only-go-one-level-deep)

### CSS Nested Rule

[Nested rules](https://github.com/postcss/postcss-nested) are unwrapped like Sass does it.

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

- javascript and typescript
- css via postcss with [nested](https://github.com/postcss/postcss-nested)
- scss via sass

### package.json

#### Configuration fields

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
      "//": "platform=node>=12.4",
      "node": {
        "require": "// target=es2019; svelte=dev:true",
        "default": "// wrapper for the cjs (require) variant"
      },
      "//": "platform=browser",
      "browser": {
        "esnext": "// target=esnext; svelte=dev:false; usedBy=@carv/cdn",
        "development": "// target=es2020; svelte=dev:true",
        "import": "// target=es2015; svelte=dev:false; usedBy=webpack,rollup,parcel",
        "script": "// umd; target=es2015; svelte=dev:false; usedBy=script"
      },
      "types": "// typescript definitions"
    },
    "//": "Used when requesting 'package-name/package.json' or 'package-name/assets/styles.css'",
    "//": "allow access to all files (including package.json, assets/, chunks/, ...)",
    "./": "./"
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

### Platform/Environment Detection

The following expressions can be used to detect during the build time for which platform and environment the current bundle is build:

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

## Configuration

```js
{
  "devOptions": { /* ... */ },
  "buildOptions": { /* ... */ },
  "proxy": { /* ... */ },
  "mount": { /* ... */ },
  "alias": { /* ... */ },
}
```

The behavior can be configured by a custom config file.

### Config Files

[cosmiconfig](https://www.npmjs.com/package/cosmiconfig) is used to load the configuration from different files in multiple formats. Sorted by [priority order](https://www.npmjs.com/package/cosmiconfig#searchplaces):

1. `package.json`: A namespaced config object (`"carv": {...}`)
1. `carv.config.cjs`: (`module.exports = {...}`) for projects using `"type": "module"`.
1. `carv.config.js`: (`module.exports = {...}`)
1. `carv.config.json`: (`{...}`)

### Top-Level Options

- **`extends`** | `string`
  - Inherit from a separate "base" config. Can be a relative file path, an npm package, or a file within an npm package. Your configuration will be merged on top of the extended base config.
- **`mount.*`**
  - Mount local directories to custom URLs in your built application.
- **`proxy.*`**
  - Configure the dev server to proxy requests. See the section below for all options.
- **`alias.*`**
  Configure import aliases for directories and packages. See the section below for all options.
- **`devOptions.*`**
  - Configure your dev server. See the section below for all options.
- **`buildOptions.*`**
  - Configure your build. See the section below for all options.
- **`jestOptions.*`**
  - Configure jest. See the section below for all options.

#### Dev Options

- **`devOptions.host`** | `string` | Default: `"localhost"`
  - To which host/ip should the dev server bind to.
- **`devOptions.port`** | `number` | Default: `5000`
  - The port number to run the dev server on.
- **`devOptions.randomPortFallback`** | `boolean` | Default: `false`
  - Prevent from falling back on a random port if the specified one is already occupied
- **`devOptions.baseUrl`** | `string` | Default: `"/"`
  - Base url to use.
- **`devOptions.open`** | `string | false` | Default: `"default"`
  - Opens the dev server in a new browser tab. If Chrome is available on macOS, an attempt will be made to reuse an existing browser tab. Any installed browser may also be specified. E.g., "chrome", "firefox", "brave". Set `"none"` to disable.
- **`devOptions.openPage`** | `string | undefined` | Default: `devOptions.baseUrl`
  - Page to navigate to when opening the browser. Will not do anything if `open=false` or `open="none"`. Remember to start with a slash or provide a full url.
- **`devOptions.openHostname`** | `string` | Default: inferred from `devOptions.host` with fallback to `"localhost"`
  - The hostname where the browser tab will be open.
- **`devOptions.inMemory`** | `boolean` | Default: `true`
  - Write bundle files in RAM instead of FS and serve them through the dev server. This is obviously more performant but there may be cross domain issues. Also, for very big apps, this might consume too much memory.
- **`devOptions.write`** | `boolean` | Default: `true`
  - If you still want to write do disk when using `devOptions.inMemory`.
- **`devOptions.clearConsole`** | `boolean` | Default: `false`
  - Clear console after successful HMR updates (Parcel style)

#### Build Options

- **`buildOptions.mode`** | `"library" | "app"` | Default: `"library"`
  - Determines what kind of bundle is created. There are two variants:
    - `library`: creates a publishable package (use `package.json#browser` to enable node and/or browser builds)
    - `app`: an all dependency included bundle
      - `umd` (es2015) for the browser unless `package.json#browser === false`
      - `esm` (es2015) for the browser unless `package.json#browser === false`
      - `cjs` (es2019) for node unless `package.json#browser === true`
- **`buildOptions.umdName`** | `string` | Default: `package.json#umdName` or `package.json#amdName` or inferred from `package.json#name`
  - Necessary for iife/umd bundles that exports values in which case it is the global variable name representing your bundle. Other scripts on the same page can use this variable name to access the exports of your bundle.

#### Proxy Options

If desired, `"proxy"` is where you configure the proxy behavior of your dev server. Define different paths that should be proxied, and where they should be proxied to.

```js
// carv.config.js
module.exports = {
  proxy: {
    // Short form:
    '/api/01': 'https://pokeapi.co/api/v1/',
    // Long form:
    '/api/02': [
      'https://pokeapi.co/api/v2/',
      {
        proxyReqPathResolver(req) {
          /* ... */
        },
      },
    ],
    // Dynamic host form:
    '/api/03': function selectProxyHost() {
      /* ... */
    },
  },
}
```

The short form of a full URL string is enough for general use.

The long form allows to use [express-http-proxy](https://github.com/villadora/express-http-proxy) for extended configuration options. You must be using a `carv.config.js` JavaScript configuration file to set this.

This configuration has no effect on the final build.

#### Mount Options

The `mount` configuration lets you map local files to their location in the final build. If no mount configuration is given, then the entire current working directory (minus excluded files) will be built and mounted to the Root URL (Default: `/`, respects `devOptions.baseUrl`).

```js
// carv.config.json
{
  "mount": {
    // Files in the local "data/" directory is available via `/data*`
    "data": "/data",
    // Files in the local "public/" directory are available via `/*`
    "public": "/"
    // … add other folders here
  }
}
```

This configuration has no effect on the final build.

#### Alias Options

The alias config option lets you define an import alias in your application. When aliasing a package, this allows you to import that package by another name in your application. This applies to imports inside of your dependencies as well, essentially replacing all references to the aliased package. The order of the entries is important, in that the first defined rules are applied first.

```js
// carv.config.js
module.exports = {
  "alias": {
    // Type 1: Package Import Alias
    "lodash": "lodash-es",
    "react": "preact/compat",
    // Type 2: Local Directory Import Alias (relative to project root)
    "components": "./src/components"
    // Create a root path alias (`import '@/a/b.js'` => `import '<root>/src/a/b.js'`)
    "@": "./src"
  }
}
```

Aliasing a local directory (any path that starts with `./`) creates a shortcut to import that file or directory. While we don't necessarily recommend this pattern, some projects do enjoy using these instead of relative paths:

```diff
-import '../../../../../Button.js';
+import '@/Button.js';
```

If your are using typescript local directory mappings should be added to the `tsconfig.json`:

```json
{
  "$schema": "http://json.schemastore.org/tsconfig",
  "extends": "./node_modules/@carv/scripts/tsconfig-preset.json",
  "include": ["src/**/*"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@": ["src"],
      "@/*": ["src/*"].
    }
  }
}
```

> Note: We are working on a solution to define these only once.
