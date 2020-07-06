const path = require('path')
const { existsSync } = require('fs')
const fs = require('fs-extra')
const execa = require('execa')
const npmRunPath = require('npm-run-path')
const micromatch = require('micromatch')
const globby = require('globby')
const cwd = process.cwd()

const EXTNAMES = ['', '.svelte', '.tsx', '.ts', '.mjs', '.jsx', '.js', '.cjs', '.json']

function resolveFile(base) {
  for (const extname of EXTNAMES) {
    const file = base + extname
    if (existsSync(file)) {
      return file.startsWith('.') ? file : `./${file}`
    }
  }
}

module.exports = function rollupBundlePlugin() {
  return {
    type: 'bundle',
    defaultBuildScript: 'bundle:*',
    async bundle({ srcDirectory, destDirectory }) {
      const manifest = JSON.parse(await fs.readFile('package.json', { encoding: 'utf-8' }))

      console.log('Copying common package files...')
      // copy readme, license, changelog to build
      const paths = await globby(
        [
          ...(manifest.files || []),
          '{changes,changelog,history,license,licence,notice,readme}?(.md|.txt)',
        ],
        {
          absolute: false,
          gitignore: true,
          caseSensitiveMatch: false,
          dot: true,
        },
      )

      await Promise.all(paths.map((src) => fs.copy(src, path.join(destDirectory, src))))

      await fs.mkdirp(srcDirectory)

      // const packageName = manifest.name.replace(/^@/, '').replace(/\//g, '__')
      const unscopedPackageName = manifest.name.replace(/^@.*\//, '')

      const inputFile =
        resolveFile(manifest.source) ||
        resolveFile(manifest.svelte) ||
        resolveFile(manifest.main) ||
        resolveFile(`src/${unscopedPackageName}`) ||
        resolveFile('src/main') ||
        resolveFile('src/index')

      if (!inputFile) throw new Error('No input file found.')

      const useTypescript = inputFile.endsWith('.ts') || inputFile.endsWith('.tsx')

      /**
       * Generate typescript definitions to build/src which allows them to be picked up by svelte
       */
      const typesDirectory = path.join(srcDirectory, 'types')

      let dtsFile

      if (useTypescript) {
        console.log('Generating typescript declarations...')
        // tsc
        await execa(
          'tsc',
          ['--emitDeclarationOnly', '--noEmit', 'false', '--outDir', typesDirectory],
          {
            cwd,
            env: {
              ...npmRunPath.env(),
            },
            extendEnv: true,
            stdout: 'inherit',
            stderr: 'inherit',
          },
        )

        dtsFile = await require('find-up')(
          path.basename(inputFile.replace(/\.(ts|tsx)$/, '.d.ts')),
          {
            cwd: path.join(typesDirectory, path.dirname(inputFile)),
          },
        )
      }

      Object.assign(manifest, {
        // Define package loading

        // Used by nodejs
        main: `node/cjs/${unscopedPackageName}.js`,

        // Modern declartions: *.svelte production transpiled
        exports: {
          '.': {
            require: `./node/cjs/${unscopedPackageName}.js`,
            jest: `./node/jest/${unscopedPackageName}.js`,
            default: `./node/esm/${unscopedPackageName}.js`,
          },
          './package.json': './package.json',
        },

        // Used by carv cdn: *.svelte production transpiled
        esnext: `browser/esnext/${unscopedPackageName}.js`,

        // Used by bundlers like rollup and cdn networks: *.svelte production transpiled
        module: `browser/es2015/${unscopedPackageName}.js`,

        // Used by snowpack dev: *.svelte development transpiled
        'browser:module': `browser/snowpack/${unscopedPackageName}.js`,

        // Typying
        types: useTypescript ? `types/${unscopedPackageName}.d.ts` : undefined,

        // Not using it - see README
        svelte: undefined,

        // Some defaults
        sideEffects: manifest.sideEffects === true,

        // Allow publish
        private: undefined,

        // Include all files in the build folder
        files: undefined,

        // Default to cjs
        type: undefined,

        // These are not needed any more
        source: undefined,
        scripts: undefined,
        devDependencies: undefined,
        // reset bundledDependencies as rollup includes those into the bundle
        bundledDependencies: undefined,
        bundleDependencies: undefined,

        // Reset config sections
        eslintConfig: undefined,
        jest: undefined,
        prettier: undefined,
        snowpack: undefined,
        graphql: undefined,
      })

      await fs.writeFile(path.join(srcDirectory, 'package.json'), JSON.stringify(manifest, null, 2))

      await fs.writeFile(
        path.join(destDirectory, 'package.json'),
        JSON.stringify(manifest, null, 2),
      )

      console.log('Starting bundling...')
      await execa('rollup', ['-c', require.resolve(`./rollup/config.js`)], {
        cwd,
        env: {
          ...npmRunPath.env(),
          BUILD_SRC_DIRECTORY: srcDirectory,
          BUILD_DEST_DIRECTORY: destDirectory,
          BUILD_INPUT_FILE: inputFile,
          BUILD_DTS_FILE: dtsFile,
        },
        extendEnv: true,
        stdout: 'inherit',
        stderr: 'inherit',
      })
    },
  }
}
