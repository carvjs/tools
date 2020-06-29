const path = require('path')

module.exports = {
  scripts: {
    'mount:public': `mount ${path.relative(process.cwd(), path.join(__dirname, 'public'))} --to /`,
    'mount:src': 'mount src --to /_dist_',
  },
  plugins: ['@snowpack/plugin-svelte', '@carv/snowpack-plugin-rollup'],
  installOptions: {
    sourceMap: true,
    rollup: {
      dedupe: ['svelte', 'svelte/internal'],
    },
  },
  buildOptions: {
    // Prevent accidental pickup of package.json[homepage]
    baseUrl: '/',
  },
}
