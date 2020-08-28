const updateNotifier = require('update-notifier')
const pkg = require('./package.json')
updateNotifier({ pkg }).notify()

if (!require('at-least-node')('12.4.0')) {
  console.error(
    'You are running Node ' +
      process.versions.node +
      '.\n' +
      'Create Carv requires Node 12.4 or higher. \n' +
      'Please update your version of Node.',
  )
  process.exit(1)
}

const fs = require('fs')
const path = require('path')
const findUp = require('find-up').sync

// ensure the binaries installed here are available as scripts
const managePath = require('manage-path')
const alterPath = managePath(process.env)
const npmBin = findUp('node_modules/.bin', { cwd: __dirname, type: 'directory' })
if (npmBin) {
  alterPath.unshift(npmBin)
}
const rootDir = require('project-root-directory')
alterPath.unshift(path.resolve(rootDir, 'node_modules', '.bin'))

const pkgDir = require('pkg-dir').sync()

const useSvelte = findUp('svelte.config.js', { cwd: pkgDir })
const useTypescript = findUp('tsconfig.json', { cwd: pkgDir })
const usePreview = fs.existsSync(path.resolve(pkgDir, 'src/__preview__'))
const useGraphql = Boolean(require('./graphql/find-config')(pkgDir))
const useTypescriptGraphql =
  useTypescript &&
  useGraphql &&
  fs.readFileSync(useTypescript, { encoding: 'utf-8' }).includes('graphql')

const extensions = ['.js', '.jsx']
if (useTypescript) extensions.push('.ts', '.tsx')

const gitignore = path.relative(process.cwd(), require('find-up').sync('.gitignore'))
const eslint = `eslint --ignore-path ${gitignore} --ext ${extensions.join(',')} .`
const prettier = `prettier --ignore-path ${gitignore}`

exports.scripts = {
  // main entrypoints
  default: usePreview ? 'nps snowpack.dev' : 'nps test',

  test: {
    default: [
      'nps',
      'prepare',
      useTypescriptGraphql && 'graphql.validate',
      'eslint',
      'test.package',
      'jest.coverage',
    ]
      .filter(Boolean)
      .join(' '),
    coverage: 'nps jest.coverage',
    watch: 'nps jest.watch',
    package: ['nps', useTypescript && 'tsc', useSvelte && 'svelte-check'].filter(Boolean).join(' '),
  },

  prepare: ['nps', 'cleanup', useTypescriptGraphql && 'graphql.typegen'].filter(Boolean).join(' '),

  build: {
    default: ['nps', 'prepare', 'build.package'].filter(Boolean).join(' '),
    package: 'carv-package',
  },

  release: {
    default: {
      script: 'nps test build.package release.publish',
      description: 'create a release',
    },
    publish: {
      script: 'npm publish ./build',
      hiddenFromHelp: true,
    },
  },

  format: {
    default: ['nps', 'format.package', 'prettier.write', 'eslint.fix'].filter(Boolean).join(' '),
    package: ['nps', 'doctoc.readme', useTypescriptGraphql && 'graphql.typegen']
      .filter(Boolean)
      .join(' '),
  },

  envinfo: 'envinfo --system --browsers --IDEs --binary --npmPackages',

  cleanup: 'rimraf .build build dist src/**/__generated__ src/**/__generated__',

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
    check: `${prettier} --check .`,
    write: `${prettier} --write .`,
    changelog: `${prettier} --write CHANGELOG.md`,
  },
  jest: {
    default: 'jest',
    coverage: 'jest --coverage --no-cache',
    watch: 'jest --watchAll',
  },
  doctoc: {
    readme: 'doctoc --github --notitle --maxlevel 2 README.md',
  },
}

if (useSvelte) {
  exports.scripts['svelte-check'] = 'svelte-check'
}

if (useTypescript) {
  exports.scripts['tsc'] = {
    default: 'tsc --noEmit',
    watch: 'tsc --noEmit --watch',
  }
}

if (useTypescriptGraphql) {
  exports.scripts['graphql'] = {
    typegen: 'ts-graphql-plugin typegen',
    validate: 'ts-graphql-plugin validate',
    report: 'ts-graphql-plugin report',
  }
}
