// ensure the binaries installed here are available as scripts
const managePath = require('manage-path')
const alterPath = managePath(process.env)
const npmBin = require('find-up').sync('node_modules/.bin', { cwd: __dirname, type: 'directory' })
if (npmBin) {
  alterPath.unshift(npmBin)
}

const eslint = 'eslint --ignore-path .gitignore --ext .js,.jsx,.ts,.tsx .'
const prettier = 'prettier --ignore-path .gitignore .'

module.exports = {
  scripts: {
    // main entrypoints
    default: 'nps snowpack.dev',
    test: {
      default: 'nps prettier.check eslint tsc svelte-check jest.coverage',
      coverage: 'nps jest.coverage',
      watch: 'nps jest.watch',
    },
    build: 'nps snowpack.build',
    release: {
      default: {
        script: 'nps test doctoc.readme build release.publish',
        description: 'create a release',
      },
      publish: {
        script: 'npm publish ./build',
        hiddenFromHelp: true,
      },
    },
    format: 'nps doctoc.readme prettier.write eslint.fix',

    // tools
    snowpack: {
      dev: 'snowpack dev',
      build: 'snowpack build',
    },
    eslint: {
      default: eslint,
      fix: `${eslint} --fix`,
    },
    prettier: {
      check: `${prettier} --check`,
      write: `${prettier} --write`,
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
    doctoc: {
      readme: 'doctoc --github --notitle --maxlevel 2 README.md',
    }
  },
}
