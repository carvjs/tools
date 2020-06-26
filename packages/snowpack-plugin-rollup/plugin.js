const path = require('path')
const { promises: fs } = require('fs')
const execa = require('execa')
const npmRunPath = require('npm-run-path')
const cwd = process.cwd()

module.exports = function rollupBundlePlugin(config, options) {
  return {
    type: 'bundle',
    defaultBuildScript: 'bundle:*',
    async bundle({ srcDirectory, destDirectory, log }) {
      const manifest = JSON.parse(
        await fs.readFile(path.join(cwd, 'package.json'), { encoding: 'utf-8' }),
      )

      const inputFile = manifest.svelte || manifest.source || manifest.main || 'src/index'

      const basename = manifest.name.replace(/^@.*\//, '')

      Object.assign(manifest, {
        main: `./cjs/${basename}.js`,
        module: `./esm/${basename}.js`,
        exports: {
          '.': {
            require: `./cjs/${basename}.js`,
            default: `./esm/${basename}.js`,
          },
          './package.json': './package.json',
        },
        sideEffects: manifest.sideEffects === true,
        files: ['cjs', 'esm'],
        devDependencies: undefined,
        scripts: undefined,
        source: undefined,
        private: undefined,
        eslintConfig: undefined,
        jest: undefined,
        prettier: undefined,
        snowpack: undefined,
      })

      await fs.writeFile(
        path.join(destDirectory, 'package.json'),
        JSON.stringify(manifest, null, 2),
      )

      await fs.mkdir(path.join(destDirectory, 'esm'))
      await fs.writeFile(
        path.join(destDirectory, 'esm', 'package.json'),
        JSON.stringify({ type: 'module' }, null, 2),
      )

      const rollupOptions = ['-c', require.resolve(`./rollup/config.js`)]

      const bundleAppPromise = execa('rollup', rollupOptions, {
        cwd,
        env: {
          ...npmRunPath.env(),
          BUILD_SRC_DIRECTORY: srcDirectory,
          BUILD_DEST_DIRECTORY: destDirectory,
          BUILD_INPUT_FILE: inputFile,
        },
        extendEnv: true,
      })
      if (bundleAppPromise.stdout) {
        bundleAppPromise.stdout.on('data', (b) => log(b.toString()))
      }
      if (bundleAppPromise.stderr) {
        bundleAppPromise.stderr.on('data', (b) => log(b.toString()))
      }

      return bundleAppPromise
    },
  }
}
