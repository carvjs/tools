# @carv/snowpack-plugin-rollup

Use rollup to bundle your application for production.

```
npm install --save-dev @carv/snowpack-plugin-rollup
```

```js
// snowpack.config.json
{
  "plugins": ["@carv/snowpack-plugin-rollup"]
}
```

## Features

- CSS files are injected into the document head via a style tag.
- Converts JSON files to ES6 modules.
- Converts YAML files to ES6 modules.
- All other imported files copied and are exported using the URL path.

  ```js
  import img from './image.png' // img === 'http://host.name/assets/image-hash.png'
  ```

## Default Build Script

```js
{
  "scripts": {"bundle:*": "@carv/snowpack-plugin-rollup"}
}
```

## Plugin Options

None

## Generated Package Contents

| Directory        | Format | Target | Svelte                  | package.json field         | Used by                                    |
| ---------------- | :----: | :----: | ----------------------- | -------------------------- | ------------------------------------------ |
| `node/cjs`       |  cjs   | es2019 | `dev: false, ssr: true` | `main` & `exports.require` | Node.JS                                    |
| `node/esm`       |  esm   | es2019 | `dev: false, ssr: true` | `exports.default`          | Node.JS                                    |
| `browser/esnext` |  esm   | esnext | `dev: false`            | `esnext`                   | carv cdn and specially configured bundlers |
| `browser/es2015` |  esm   | es2015 | `dev: false`            | `module`                   | bundlers like rollup and cdn networks      |
| `dev`            |  esm   | es2020 | `dev: true`             | `browser:module`           | snowpack                                   |
| `types`          |  esm   | esnext | typed                   | `types`                    | typescript definitions                     |

All assets are put into `assets` directory.

> We are not using the `svelte` package.json field. This field is used by the `rollup-plugin-svelte` to transpile `*.svelte` files in `node_modules`. It would require to copy the **whole** `src` directory. If any dependency uses a svelte preprocessor each project would need to setup svelte preprocess in the same way.
