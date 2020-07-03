const updateNotifier = require('update-notifier')
const pkg = require('./package.json')
updateNotifier({ pkg }).notify()

const fs = require('fs')
const path = require('path')

// ensure the binaries installed here are available as scripts
const managePath = require('manage-path')
const alterPath = managePath(process.env)
const npmBin = require('find-up').sync('node_modules/.bin', { cwd: __dirname, type: 'directory' })
if (npmBin) {
  alterPath.unshift(npmBin)
}

const pkgDir = require('pkg-dir').sync()

const useSvelte = fs.existsSync(path.resolve(pkgDir, 'svelte.config.js'))
const useTypescript = fs.existsSync(path.resolve(pkgDir, 'tsconfig.json'))
const usePreview = fs.existsSync(path.resolve(pkgDir, 'src/__preview__'))
const useGraphql = Boolean(require('./graphql/find-config')(pkgDir))
const useTypescriptGraphql =
  useTypescript &&
  useGraphql &&
  fs.readFileSync(path.resolve(pkgDir, 'tsconfig.json'), { encoding: 'utf-8' }).includes('graphql')

const extensions = ['.js', '.jsx']
if (useTypescript) extensions.push('.ts', '.tsx')

const eslint = `eslint --ignore-path .gitignore --ext ${extensions.join(',')} .`
const prettier = 'prettier --ignore-path .gitignore .'

exports.scripts = {
  // main entrypoints
  default: usePreview ? 'nps snowpack.dev' : 'nps test',

  test: {
    default: [
      'nps',
      'prettier.check',
      useTypescriptGraphql && 'graphql.validate',
      useTypescriptGraphql && 'graphql.typegen',
      'eslint',
      useTypescript && 'tsc',
      useSvelte && 'svelte-check',
      'jest.coverage',
    ]
      .filter(Boolean)
      .join(' '),
    coverage: 'nps jest.coverage',
    watch: 'nps jest.watch',
  },

  build: ['nps', useTypescriptGraphql && 'graphql.typegen', 'snowpack.build']
    .filter(Boolean)
    .join(' '),

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

  format: [
    'nps',
    'doctoc.readme',
    useTypescriptGraphql && 'graphql.typegen',
    'prettier.write',
    'eslint.fix',
  ]
    .filter(Boolean)
    .join(' '),

  envinfo: 'envinfo --system --browsers --IDEs --binary --npmPackages',

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
