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

      await paths.map((src) => fs.copy(src, path.join(destDirectory, src)))

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
      const useSvelte = Boolean(manifest.svelte) || existsSync('svelte.config.js')

      /**
       * Generate typescript definitions to build/src which allows them to be picked up by svelte
       */
      const typesDirectory = path.join(srcDirectory, 'types')

      let dtsFile

      if (useTypescript) {
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

        if (useSvelte) {
          const ignorePatterns = [
            '**/__tests__/*.?(.d){js,jsx,ts,tsx}?(.map)',
            ,
            '**/*.{spec,test}?(.d).{js,jsx,ts,tsx}?(.map)',
            '**/__fixtures__/**',
            '**/__mocks__/**',
            '**/__preview__/**',
          ].map((pattern) => micromatch.matcher(pattern, { matchBase: true }))

          await fs.copy(typesDirectory, path.join(destDirectory, path.dirname(inputFile)), {
            filter(src, dest) {
              const file = path.relative(destDirectory, dest)

              return !ignorePatterns.some((isMatch) => isMatch(file))
            },
          })
        }
      }

      Object.assign(manifest, {
        // Allow publish
        private: undefined,

        // Include all files in the build folder
        files: undefined,

        // Define package loading

        // Used by nodejs: *.svelte production transpiled
        main: `cjs/${unscopedPackageName}.js`,

        // Modern declartions: *.svelte production transpiled
        exports: {
          '.': {
            require: `./cjs/${unscopedPackageName}.js`,
            default: `./esm/${unscopedPackageName}.js`,
          },
          './package.json': './package.json',
        },

        // Used by rollup: *.svelte production transpiled
        module: `esm/${unscopedPackageName}.js`,

        // Used by snowpack dev: *.svelte development transpiled
        'browser:module': useSvelte ? `dev/${unscopedPackageName}.js` : undefined,

        // Used by svelte and jest: point to untranspiled *.svelte
        svelte:
          manifest.svelte ||
          (useSvelte
            ? `${path.join(
                path.dirname(inputFile),
                path.basename(inputFile, path.extname(inputFile)),
              )}.js`
            : undefined),

        // Typying
        types: useTypescript ? `types/${unscopedPackageName}.d.ts` : undefined,

        // Some defaults
        sideEffects: manifest.sideEffects === true,

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

      await fs.mkdir(path.join(destDirectory, 'esm'))
      await fs.writeFile(
        path.join(destDirectory, 'esm', 'package.json'),
        JSON.stringify({ type: 'module' }, null, 2),
      )

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
