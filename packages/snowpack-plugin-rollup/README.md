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
