const path = require('path')
const { existsSync, promises: fs } = require('fs')
const execa = require('execa')
const npmRunPath = require('npm-run-path')
const cwd = process.cwd()

const EXTNAMES = ['', '.svelte', '.tsx', '.ts', '.mjs', '.jsx', '.js', '.cjs', '.json']

function resolveFile(base) {
  for (const extname of EXTNAMES) {
    const file = base + extname
    if (existsSync(file)) {
      return file
    }
  }
}

module.exports = function rollupBundlePlugin(config, options) {
  return {
    type: 'bundle',
    defaultBuildScript: 'bundle:*',
    async bundle({ srcDirectory, destDirectory, log }) {
      const manifest = JSON.parse(await fs.readFile('package.json', { encoding: 'utf-8' }))

      // copy readme, license, changelog to build
      async function copyFile(name) {
        const src = path.join(process.cwd(), name)

        if (existsSync(src)) {
          await fs.copyFile(src, path.join(destDirectory, name))
        }
      }

      await Promise.all([
        copyFile('README.md'),
        copyFile('LICENSE'),
        copyFile('LICENCE'),
        copyFile('NOTICE'),
        copyFile('CHANGELOG.md'),
      ])

      // const packageName = manifest.name.replace(/^@/, '').replace(/\//g, '__')
      const unscopedPackageName = manifest.name.replace(/^@.*\//, '')

      const inputFile =
        manifest.source ||
        manifest.svelte ||
        manifest.main ||
        resolveFile(`src/${unscopedPackageName}`) ||
        resolveFile('src/main') ||
        resolveFile('src/index')

      if (!inputFile) throw new Error('No input file found.')

      const useTypescript = inputFile.endsWith('.ts') || inputFile.endsWith('.tsx')

      Object.assign(manifest, {
        // Allow publish
        private: undefined,

        // Include all files in the build folder
        // TODO use .npmignore to exclude test files from src
        files: undefined,

        // Define package loading
        main: `./cjs/${unscopedPackageName}.js`,
        module: `./esm/${unscopedPackageName}.js`,
        exports: {
          '.': {
            require: `./cjs/${unscopedPackageName}.js`,
            default: `./esm/${unscopedPackageName}.js`,
          },
          './package.json': './package.json',
        },
        types: useTypescript ? `./types/${unscopedPackageName}.d.ts` : undefined,

        // Some defaults
        sideEffects: manifest.sideEffects === true,

        // These are not needed any more
        source: undefined,
        scripts: undefined,
        devDependencies: undefined,

        // Reset config sections
        eslintConfig: undefined,
        jest: undefined,
        prettier: undefined,
        snowpack: undefined,
        np: undefined,
      })

      await fs.writeFile(path.join(srcDirectory, 'package.json'), JSON.stringify(manifest, null, 2))

      await fs.writeFile(
        path.join(destDirectory, 'package.json'),
        JSON.stringify(manifest, null, 2),
      )

      await fs.mkdir(path.join(destDirectory, 'esm'))
      await fs.writeFile(
        path.join(destDirectory, 'esm', 'package.json'),
        JSON.stringify({ type: 'module' }, null, 2),
      )

      const rollupPromise = execa('rollup', ['-c', require.resolve(`./rollup/config.js`)], {
        cwd,
        env: {
          ...npmRunPath.env(),
          BUILD_SRC_DIRECTORY: srcDirectory,
          BUILD_DEST_DIRECTORY: destDirectory,
          BUILD_INPUT_FILE: inputFile,
        },
        extendEnv: true,
      })

      if (rollupPromise.stdout) {
        rollupPromise.stdout.on('data', (b) => log(b.toString()))
      }

      if (rollupPromise.stderr) {
        rollupPromise.stderr.on('data', (b) => log(b.toString()))
      }

      await rollupPromise

      /**
       * Generate typescript definitions
       */
      const typesDirectory = path.join(srcDirectory, 'types')

      if (useTypescript) {
        // tsc
        const tscPromise = execa(
          'tsc',
          ['--emitDeclarationOnly', '--noEmit', 'false', '--outDir', typesDirectory],
          {
            cwd,
            env: {
              ...npmRunPath.env(),
            },
            extendEnv: true,
          },
        )

        if (tscPromise.stdout) {
          tscPromise.stdout.on('data', (b) => log(b.toString()))
        }

        if (tscPromise.stderr) {
          tscPromise.stderr.on('data', (b) => log(b.toString()))
        }

        await tscPromise

        // api-extractor run --local --verbose --config api-extractor.json
        const apiExtractorConfigFile = path.join(srcDirectory, 'types', 'api-extractor.json')

        const mainEntryPointFilePath = await require('find-up')(
          path.basename(inputFile.replace(/\.(ts|tsx)$/, '.d.ts')),
          {
            cwd: path.join(typesDirectory, path.dirname(inputFile)),
          },
        )

        await fs.writeFile(
          apiExtractorConfigFile,
          JSON.stringify(
            {
              mainEntryPointFilePath,
              bundledPackages: Object.keys(manifest.dependencies || {}),
              dtsRollup: {
                enabled: true,
                untrimmedFilePath: path.join(destDirectory, manifest.types),
              },
              apiReport: { enabled: false },
              docModel: { enabled: false },
              tsdocMetadata: { enabled: false },
              messages: {
                extractorMessageReporting: {
                  'ae-missing-release-tag': {
                    logLevel: 'none',
                  },
                },
              },
            },
            null,
            2,
          ),
        )

        const apiExtractorPromise = execa(
          'api-extractor',
          ['run', '--local', '--verbose', '--config', apiExtractorConfigFile],
          {
            cwd,
            env: {
              ...npmRunPath.env(),
            },
            extendEnv: true,
          },
        )

        if (apiExtractorPromise.stdout) {
          apiExtractorPromise.stdout.on('data', (b) => log(b.toString()))
        }

        if (apiExtractorPromise.stderr) {
          apiExtractorPromise.stderr.on('data', (b) => log(b.toString()))
        }

        await apiExtractorPromise
      }
    },
  }
}
