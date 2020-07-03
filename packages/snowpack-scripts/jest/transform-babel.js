const babelJest = require('babel-jest')

module.exports = babelJest.createTransformer({
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        shippedProposals: true,
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    require('@snowpack/app-scripts-svelte/jest/importMetaBabelPlugin'),
    require.resolve('dynamic-import-node'),
  ],
})
