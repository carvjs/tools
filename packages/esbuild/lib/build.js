#!/usr/bin/env node

const pkg = require('../package.json')

// https://github.com/egoist/tsup
// https://github.com/a7ul/esbuild-node-tsc
// https://github.com/rsms/estrella

// https://github.com/rollup/plugins/pull/540/files
// https://github.com/ljharb/list-exports/blob/main/packages/ls-exports/README.md
const exports = {
  node: {
    production: {
      require: {
        // node/production/index.js
        directory: 'node/production',
        platform: 'node',
        target: 'node10.4',
        format: 'cjs',
        mainFields: ['main'],
        packageField: 'main',
        define: {
          'process.env.NODE_ENV': '"production"',
        },
      },
      default: {
        // node/production/index.mjs
        // import cjsModule from './index.js';
        // export const name = cjsModule.name;
        // export default cjsModule;
        esmWrapper: '',
      },
    },
    development: {
      require: {
        // node/development/index.js
        directory: 'node/development',
        platform: 'node',
        target: 'node10.4',
        format: 'cjs',
        mainFields: ['main'],
      },
      default: {
        // node/development/index.mjs
        // import cjsModule from './index.js';
        // export const name = cjsModule.name;
        // export default cjsModule;
        esmWrapper: '',
      },
    },
    require: {
      // if (process.env.NODE_ENV === 'production') { ... } else { ... }
      // node/index.js
      directory: 'node',
      platform: 'node',
      target: 'node10.4',
      format: 'cjs',
      mainFields: ['main'],
    },
    esnext: {
      // node/esnext/index.mjs
      directory: 'node/esnext',
      platform: 'node',
      target: 'es2020',
      format: 'esm',
      mainFields: ['esnext', 'es2015', 'module', 'main'],
      outExtension: { '.js': '.mjs' },
    },
    default: {
      // node/index.mjs
      // import cjsModule from './index.js';
      // export const name = cjsModule.name;
      // export default cjsModule;
      esmWrapper: '',
    },
  },
  browser: {
    development: {
      // browser/development/index.js
      directory: 'browser/development',
      platform: 'browser',
      target: 'es2020',
      format: 'esm',
      mainFields: ['browser:module', 'esnext', 'es2015', 'module', 'browser', 'main'],
      packageField: 'browser:module',
    },
    esnext: {
      // browser/esnext/index.js
      directory: 'browser/esnext',
      platform: 'browser',
      target: 'es2020',
      format: 'esm',
      mainFields: ['esnext', 'es2015', 'module', 'browser', 'main'],
      packageField: 'esnext',
    },
    script: {
      file: 'browser/script.js',
      platform: 'browser',
      target: 'es2015',
      format: 'iife',
      mainFields: ['esnext', 'es2015', 'module', 'browser', 'main'],
      packageField: 'unpkg',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    },
    default: {
      // browser/import/index.js
      directory: 'browser/import',
      platform: 'browser',
      target: 'es2015',
      format: 'esm',
      mainFields: ['esnext', 'es2015', 'module', 'browser', 'main'],
      packageField: 'module',
    },
  },
  require: {
    // Alias for node.require
  },
  types: {},
  default: {
    // Alias for browser.default
  },
}

async function build(service) {
  console.time('build')
  await service.build({
    entryPoints: ['src/index.ts'],
    // outbase: 'src',
    outdir: 'dist/node',
    // outfile: 'dist/node/mestrics-process.mjs',
    // 'browser' | 'node'
    platform: 'node',
    target: 'node10.4',
    // target: 'es2020',
    // target=chrome58,firefox57,safari11,edge16
    // 'ascii' | 'utf8'
    charset: 'utf8',
    // 'iife' | 'cjs' | 'esm';
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    // https://esbuild.github.io/api/#main-fields
    // mainFields: [],
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.cjs', '.css', '.json'],
    // export type Loader = 'js' | 'jsx' | 'ts' | 'tsx' | 'css' | 'json' | 'text' | 'base64' | 'file' | 'dataurl' | 'binary' | 'default';
    // loader?: { [ext: string]: Loader };
    define: {
      // 'process.env.NODE_ENV': '"production"'
    },
    bundle: true,
    splitting: true,
    sourcemap: 'external',
    minify: false,
    // metafile: 'dist/node/meta.json',
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      // TODO remove bundledDependencies
    ],
  })
  console.timeEnd('build')
}

async function main() {
  let service = await require('esbuild').startService()

  try {
    await build(service)
  } finally {
    service.stop()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
