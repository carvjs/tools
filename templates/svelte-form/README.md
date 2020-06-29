# form-template

A base for building shareable Svelte forms. Clone it with [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit @carvjs/snowpack/template/svelte-form my-new-form
cd my-new-form
npm install # or yarn
```

Your forms's source code lives in `src/form.svelte`.

You can create a package that exports multiple forms by adding them to the `src` directory and editing `src/index.js` to reexport them as named exports.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [form-template](#form-template)
  - [Setting up](#setting-up)
  - [Available Scripts](#available-scripts)
    - [npm start](#npm-start)
    - [npm test](#npm-test)
  - [Create a release](#create-a-release)
  - [Folder Structure](#folder-structure)
    - [`src/`](#src)
    - [`src/__preview__/`](#srcpreview)
  - [Recommended VS Code Extensions](#recommended-vs-code-extensions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

Two sub scripts will came in handy from time to time:

- `npm start test.watch`: re-run tests on change
- `npm start test.coverage`: creates a coverage report at `coverage/lcov-report/index.html`

## Create a release

1. Update changelog
2. `npm run format`
3. git commit -a -m "chore: prepare release`
4. [npm version [<newversion> | major | minor | patch] -m "chore: release"](https://docs.npmjs.com/cli/version)
5. `npm run release`

## Folder Structure

### `src/`

Put all your source code including your test files here. Test files
are matched using the following regexp:

- `src/**/__tests__/*.{js,jsx,ts,tsx}`: matches every file within a `__tests__` directory but not in child directories
- `src/**/*.{spec,test}.{js,jsx,ts,tsx}`: matches `*.test.js` and `*.spec.js` files; some for the other extensions

### `src/__preview__/`

This directory is used by snowpack on `npm start` to render a preview of your code.
Modify `src/__preview__/app.svelte` to match your needs.

## Recommended VS Code Extensions

- [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
- [Jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [GraphQL](https://marketplace.visualstudio.com/items?itemName=Prisma.vscode-graphql)
- [npm](https://marketplace.visualstudio.com/items?itemName=eg2.vscode-npm-script)
