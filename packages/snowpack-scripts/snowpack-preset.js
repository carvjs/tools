const path = require('path')
const fs = require('fs')

const pkgDir = require('pkg-dir').sync()
const svelteConfig = path.resolve(pkgDir, 'svelte.config.js')
const useSvelte = fs.existsSync(svelteConfig)

module.exports = {
  scripts: {
    'mount:public': `mount ${path.relative(process.cwd(), path.join(__dirname, 'public'))} --to /`,
    'mount:src': 'mount src --to /_dist_',
  },
  plugins: ['@snowpack/plugin-svelte', '@carv/snowpack-plugin-rollup'],
  installOptions: {
    sourceMap: true,
    rollup: {
      dedupe: ['svelte'],
      plugins: [
        require('rollup-plugin-node-polyfills')(),
        useSvelte && require('rollup-plugin-svelte')(require(svelteConfig)),
      ].filter(Boolean),
    },
  },
  buildOptions: {
    // Prevent accidental pickup of package.json[homepage]
    baseUrl: '/',
  },
}
