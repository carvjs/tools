# form-template

A base for building shareable Svelte forms. Clone it with [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit @carvjs/snowpack/template/form my-new-form
cd my-new-form
npm install # or yarn
```

Your forms's source code lives in `src/form.svelte`.

You can create a package that exports multiple forms by adding them to the `src` directory and editing `src/index.js` to reexport them as named exports.

## Setting up

- Run `npm init` (or `yarn init`)
- Replace this README with your own

## Available Scripts

### npm start

Runs the app in the development mode.
Open http://localhost:8080 to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### npm test

Launches the test runner in the interactive watch mode.
See the section about running tests for more information.

Two sub scripts will came in handy from time to time:

- `npm run test:watch`: re-run tests on change
- `npm run test:coverage`: the create a coverage report at `coverage/lcov-report/index.html`

### npm run build

Builds a publishable package of your code to the `build/` folder.
The package is ready to be published:

1. check if everything is alright - `npm publish build/ --dry-run`
2. then go for it - `npm publish build/`

## Folder Structure

### `src/`

Put all your source code including your test files here. Test files
are matched using the following regexp:

- `src/**/__tests__/*.{js,jsx,ts,tsx}`: matches every file within a `__tests__` directory but not in child directories
- `src/**/*.{spec,test}.{js,jsx,ts,tsx}`: matches `*.test.js` and `*.spec.js` files; some for the other extensions

### `src/__preview__/`

This directory is used by snowpack on `npm start` to render a preview of your code.
Modify `src/__preview__/app.svelte` to match your needs.

### `public/`

Additional assets for the preview. The `public/index.html` file has a script tag pointing to
`src/__preview__/index.js` which is the main entrypoint for the preview.

## Recommended VS Code Extensions

- [Svelte](https://marketplace.visualstudio.com/items?itemName=JamesBirtles.svelte-vscode)
- [Jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [GraphQL](https://marketplace.visualstudio.com/items?itemName=Prisma.vscode-graphql)
- [npm](https://marketplace.visualstudio.com/items?itemName=eg2.vscode-npm-script)
