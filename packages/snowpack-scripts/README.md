# @carv/snowpack-scripts

## Features

- `import Button from 'src/components/Button'`

### Jest

```json
{
  "jest": {
    "preset": "@carv/snowpack-scripts-svelte"
  }
}
```

- `@carv/snowpack-scripts-svelte/jest-preset.js`
- `jest.setup.js`
- Transforms
  - `*.svelte`
  - `*.module.(css|scss|less)` -> identity object proyy
  - `*.(css|scss|less|jpg|jpeg|png|gif|ico|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)` -> file basename
- test match
  - `src/**/__tests__/*.{js,jsx,ts,tsx`
  - `src/**/*.{spec,test}.{js,jsx,ts,tsx}`
- test environment: [jest-environment-jsdom-sixteen](https://www.npmjs.com/package/jest-environment-jsdom-sixteen)
