#!/usr/bin/env node
// https://github.com/egoist/tsup
// https://github.com/a7ul/esbuild-node-tsc
// https://github.com/rsms/estrella

// https://github.com/rollup/plugins/pull/540/files
// https://github.com/ljharb/list-exports/blob/main/packages/ls-exports/README.md

const fs = require('fs-extra')
const path = require('path')

async function main() {
  const paths = require('../lib/package-paths')
  const manifest = require('../lib/package-manifest')
  const use = require('../lib/package-use')
  const unscopedPackageName = require('../lib/unscoped-package-name')

  await require('../lib/copy-files')()

  const inputFile = require('../lib/get-input-file')()

  const useTypescript = use.typescript && (inputFile.endsWith('.ts') || inputFile.endsWith('.tsx'))

  const typesDirectory = path.join(paths.build, 'types')

  let dtsFile

  if (useTypescript) {
    const execa = require('execa')
    const npmRunPath = require('npm-run-path')

    console.time('Generating typescript declarations...')
    await fs.mkdirp(typesDirectory)

    await execa(
      'tsc',
      [
        '--emitDeclarationOnly',
        '--noEmit',
        'false',
        '--jsx',
        'preserve',
        '--project',
        paths.typescriptConfig,
        '--outDir',
        typesDirectory,
      ],
      {
        cwd: paths.root,
        env: {
          ...npmRunPath.env(),
        },
        extendEnv: true,
        stdout: 'inherit',
        stderr: 'inherit',
      },
    )

    const sourceDtsFile = await require('find-up')(
      path.basename(inputFile.replace(/\.(ts|tsx)$/, '.d.ts')),
      {
        cwd: path.resolve(typesDirectory, path.relative(paths.root, path.dirname(inputFile))),
      },
    )

    console.timeEnd('Generating typescript declarations...')

    dtsFile = path.join(paths.dist, `types/${unscopedPackageName}.d.ts`)

    console.time('build ' + path.relative(process.cwd(), dtsFile))

    const rollup = require('rollup')
    const bundle = await rollup.rollup({
      input: path.relative(process.cwd(), sourceDtsFile),
      plugins: [(0, require('rollup-plugin-dts').default)()],
    })

    await bundle.write({
      format: 'esm',
      file: dtsFile,
      sourcemap: true,
      preferConst: true,
      exports: 'auto',
    })

    console.timeEnd('build ' + path.relative(process.cwd(), dtsFile))
  }

  const outputs = {
    require: maybe(manifest.browser !== true, {
      outfile: `./node/${unscopedPackageName}.js`,
      platform: 'node',
      target: 'node10.4',
      format: 'cjs',
      mainFields: ['esnext', 'es2015', 'module', 'main'],
    }),
    esnext: {
      outfile: `./esnext/${unscopedPackageName}.js`,
      platform: manifest.browser === false ? 'node' : 'browser',
      target: 'es2020',
      format: 'esm',
      mainFields: ['esnext', 'es2015', 'module', 'main'],
    },
    script: maybe(manifest.browser !== false, {
      outfile: `./script/${unscopedPackageName}.js`,
      platform: 'browser',
      target: 'es2015',
      format: 'iife',
      mainFields: ['esnext', 'es2015', 'module', 'browser', 'main'],
      minify: true,
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    }),
    default: {
      outfile: `./module/${unscopedPackageName}.js`,
      platform: manifest.browser === false ? 'node' : 'browser',
      target: 'es2015',
      format: 'esm',
      mainFields: ['esnext', 'es2015', 'module', 'browser', 'main'],
    },
  }

  const publishManifest = {
    ...manifest,

    // Define package loading
    // https://gist.github.com/sokra/e032a0f17c1721c71cfced6f14516c62
    exports: {
      ...manifest.exports,
      '.': {
        ...Object.fromEntries(
          Object.entries(outputs)
            .map(([condition, output]) => {
              return output && [condition, output.outfile]
            })
            .filter(Boolean),
        ),
        types: dtsFile && './' + path.relative(paths.dist, dtsFile),
      },

      // All access to all files (including package.json, assets, chunks, ...)
      './': './',
    },

    // Used by nodejs
    main: outputs.require?.outfile,

    // Used by carv cdn: *.svelte production transpiled
    esnext: outputs.esnext?.outfile,

    // Used by bundlers like rollup and cdn networks: *.svelte production transpiled
    module: outputs.default?.outfile,

    // Can be used from a normal script tag without module system.
    unpkg: outputs.script?.outfile,

    // Typying
    types: dtsFile && './' + path.relative(paths.dist, dtsFile),

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

    // Reset bundledDependencies as esbuild includes those into the bundle
    bundledDependencies: undefined,
    bundleDependencies: undefined,

    // Reset config sections
    carv: undefined,
    eslintConfig: undefined,
    jest: undefined,
    prettier: undefined,
    graphql: undefined,
    'size-limit': undefined,
  }

  await fs.writeFile(
    path.join(paths.dist, 'package.json'),
    JSON.stringify(publishManifest, null, 2),
  )

  // Bundled dependencies are included into the output bundle
  const bundledDependencies = []
    .concat(manifest.bundledDependencies || [])
    .concat(manifest.bundleDependencies || [])

  const external = Object.keys({
    ...manifest.dependencies,
    ...manifest.peerDependencies,
    ...manifest.devDependencies,
    ...manifest.optinonalDependencies,
  }).filter((dependency) => !bundledDependencies.includes(dependency))

  const service = await require('esbuild').startService()

  try {
    await Promise.all(
      Object.entries(outputs)
        .filter(([_key, output]) => output)
        .map(async ([key, output]) => {
          const outfile = path.resolve(paths.dist, output.outfile)

          console.time('build ' + path.relative(process.cwd(), outfile))

          await service.build({
            ...output,
            outfile,
            entryPoints: [inputFile],
            charset: 'utf8',
            resolveExtensions: ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.cjs', '.css', '.json'],
            bundle: true,
            sourcemap: 'external',
            metafile: path.resolve(paths.build, `${outfile}.meta.json`),
            external: output.format === 'iife' ? [] : external,
          })

          console.timeEnd('build ' + path.relative(process.cwd(), outfile))
        }),
    )
  } finally {
    service.stop()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

function maybe(condition, truthy, falsy) {
  return condition ? truthy : falsy
}
