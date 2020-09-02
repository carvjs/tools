/* eslint-env node */

require('v8-compile-cache')

const updateNotifier = require('update-notifier')
const pkg = require('./package.json')
updateNotifier({ pkg }).notify()

if (!require('at-least-node')('14.8.0')) {
  console.error(
    'You are running Node ' +
      process.versions.node +
      '.\n' +
      'Create Carv requires Node 14.8 or higher. \n' +
      'Please update your version of Node.',
  )

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
}

const fs = require('fs')
const path = require('path')
const findUp = require('find-up').sync

// Ensure binaries from installed packages are available as scripts
const managePath = require('manage-path')
const alterPath = managePath(process.env)
const npmBin = findUp('node_modules/.bin', { cwd: __dirname, type: 'directory' })
if (npmBin) {
  alterPath.unshift(npmBin)
}

const projectRoot = require('project-root-directory')
alterPath.unshift(path.resolve(projectRoot, 'node_modules', '.bin'))

const paths = require('./lib/package-paths')
alterPath.unshift(path.resolve(paths.root, 'node_modules', '.bin'))

const use = require('./lib/package-use')

const extensions = ['.js', '.jsx', '.cjs', '.mjs']
if (use.typescript) extensions.push('.ts', '.tsx')

const gitignore = path.relative(
  process.cwd(),
  require('find-up').sync('.gitignore', { cwd: paths.root }),
)
const eslint = `eslint --ignore-path ${gitignore} --ext ${extensions.join(',')} .`
const prettier = `prettier --ignore-path ${gitignore}`
const jest = `jest --passWithNoTests`

const rollupConfig = path.relative(
  process.cwd(),
  fs.existsSync(path.join(paths.root, 'rollup.config.mjs'))
    ? path.join(paths.root, 'rollup.config.mjs')
    : fs.existsSync(path.join(paths.root, 'rollup.config.cjs'))
    ? path.join(paths.root, 'rollup.config.cjs')
    : fs.existsSync(path.join(paths.root, 'rollup.config.js'))
    ? path.join(paths.root, 'rollup.config.js')
    : require.resolve('./rollup/config.cjs'),
)
const rollup = `rollup --config ${rollupConfig}`

exports.scripts = {
  // Main entrypoints
  default: use.svelte ? 'nps build.watch' : 'nps test',

  test: {
    default: ['nps', 'prepare', 'test.check', 'jest.coverage'].join(' '),
    coverage: 'nps jest.coverage',
    watch: 'nps jest.watch',
    check: ['nps', 'eslint', use.typescript && 'tsc', use.svelte && 'svelte-check'].filter(Boolean).join(' '),
  },

  prepare: ['nps', 'cleanup'].join(' '),

  build: {
    default: ['nps', 'prepare', 'build.package'].join(' '),
    package: rollup,
    watch: `${rollup} --watch`,
  },

  release: {
    default: {
      script: 'nps test build.package release.publish',
      description: 'create a release',
    },
    publish: {
      script: 'npm publish ./dist',
      hiddenFromHelp: true,
    },
  },

  format: {
    default: ['nps', 'format.package', 'prettier.write', 'eslint.fix'].join(' '),
    package: ['nps', 'doctoc.readme'].join(' '),
  },

  envinfo: 'envinfo --system --browsers --IDEs --binary --npmPackages',

  cleanup:
    'rimraf ' +
    [paths.build, paths.dist, path.join(paths.source, '**', '__generated__')]
      .map((p) => path.relative(process.cwd(), p))
      .join(' '),

  // Tools
  eslint: {
    default: eslint,
    fix: `${eslint} --fix`,
  },

  prettier: {
    check: `${prettier} --check .`,
    write: `${prettier} --write .`,
    changelog: `${prettier} --write CHANGELOG.md`,
  },

  jest: {
    default: `${jest}`,
    coverage: `${jest} --coverage --no-cache`,
    watch: `${jest} --watchAll`,
  },

  doctoc: {
    readme: 'doctoc --github --notitle --maxlevel 2 README.md',
  },
}

if (use.svelte) {
  exports.scripts['svelte-check'] = 'svelte-check'
}

if (use.typescript) {
  const tsc = `tsc --project ${path.relative(process.cwd(), paths.typescriptConfig)} --noEmit`

  exports.scripts.tsc = {
    default: tsc,
    watch: `${tsc} --watch`,
  }
}
