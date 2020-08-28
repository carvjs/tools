<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [@carv/scripts](#carvscripts)
  - [Usage](#usage)
  - [Features](#features)
    - [package.json](#packagejson)
    - [Configuration fields](#configuration-fields)
      - [Generated for publish](#generated-for-publish)
    - [Jest](#jest)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# @carv/scripts

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


### package.json

### Configuration fields

- `browser`: determines if this package maybe use in the browser
  - `false`: use eslint browser environment, build no browser variants
  - `true`: use eslint node environment, build no node variants
  - otherwise: use eslint shared-node-browser environment; build node & browser variants
- `exports`: additional exports; merged with the one below

#### Generated for publish

```json
{
  "//": "see https://gist.github.com/sokra/e032a0f17c1721c71cfced6f14516c62",
  "exports": {
    "//": "used when requesting 'package-name'",
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
        "default": "// target=es2015; svelte=dev:false; usedBy=webpack,rollup,parcel",
      },
      "types": "// typescript definitions",
    },
    "//": "used when requesting 'package-name/package.json'",
    "./package.json": "./package.json",
  },
  "//": "see https://github.com/stereobooster/package.json",
  "main": "// target=es2019; svelte=dev:true",
  "esnext": "// target=esnext; svelte=dev:false; usedBy=@carv/cdn",
  "module": "// target=es2015; svelte=dev:false; usedBy=webpack,rollup,parcel",
  "browser:module": "// target=es2020; svelte=dev:true; usedBy=snowpack",
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
