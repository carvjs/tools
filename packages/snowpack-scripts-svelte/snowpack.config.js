const path = require('path')
const defaults = require('@snowpack/app-scripts-svelte')

module.exports = {
  ...defaults,
  scripts: {
    ...defaults.scripts,
    'mount:public': `mount ${path.relative(process.cwd(), path.join(__dirname, 'public'))} --to /`,
  },
  plugins: [...defaults.plugins, '@carv/snowpack-plugin-rollup'],
  installOptions: {
    ...defaults.installOptions,
    sourceMap: true,
    rollup: {
      ...defaults.rollup,
      dedupe: [...((defaults.rollup || {}).dedupe || []), 'svelte'],
    },
  },
}
