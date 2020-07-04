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

| directory        | format | target | svelte      | package.json           | comment                                            |
| ---------------- | :----: | :----: | ----------- | ---------------------- | -------------------------------------------------- |
| `node/cjs`       |  cjs   | es2019 | production  | `main` & `exports.cjs` | standard Node.JS                                   |
| `node/esm`       |  esm   | es2019 | production  | `exports.default`      | modern Node.JS                                     |
| `browser/esnext` |  esm   | esnext | production  | `esnext`               | used by carv cdn and specially configured bundlers |
| `browser/es2015` |  esm   | es2015 | production  | `module`               | used by bundlers like rollup and cdn networks      |
| `dev`            |  esm   | es2020 | development | `browser:module`       | used by snowpack                                   |
| `src`            |  esm   | esnext | raw         | `svelte`               | used by svelte rollup plugin                       |
| `types`          |  esm   | esnext | typed       | `types`                | typescript definitions                             |

Additionally all assets are put into `assets` directory.
