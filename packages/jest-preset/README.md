# @carv/jest-preset

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
  "jest": {
    "preset": "@carv/jest-preset"
  }
}
```

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
