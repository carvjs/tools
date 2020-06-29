// ensure the binaries installed here are available as scripts
const managePath = require('manage-path')
const alterPath = managePath(process.env)
const npmBin = require('find-up').sync('node_modules/.bin', { cwd: __dirname, type: 'directory' })
if (npmBin) {
  alterPath.unshift(npmBin)
}

module.exports = {
  scripts: {
    // main entrypoints
    default: 'nps snowpack.dev',
    test: {
      default: 'nps prettier.check eslint tsc svelte-check jest.coverage',
      coverage: 'nps jest.coverage',
      watch: 'nps jest.watch',
    },
    release: {
      script: 'nps test doctoc build release.publish',
      description: 'create a release',
      publish: {
        script: 'npm publish ./build',
        hiddenFromHelp: true,
      },
    },
    format: 'nps doctoc prettier.write eslint.fix',

    // tools
    snowpack: {
      dev: 'snowpack dev',
      build: 'snowpack build',
    },
    eslint: {
      default: 'eslint --ignore-path .gitignore .',
      fix: 'eslint --ignore-path .gitignore . --fix',
    },
    prettier: {
      check: 'prettier --ignore-path .gitignore . --check',
      write: 'prettier --ignore-path .gitignore . --write',
    },
    'svelte-check': 'svelte-check',
    jest: {
      default: 'jest',
      coverage: 'jest --coverage --no-cache',
      watch: 'jest --watchAll',
    },
    tsc: {
      default: 'tsc --noEmit',
      watch: 'tsc --noEmit --watch',
    },
    doctoc: 'doctoc --github README.md',
  },
}
