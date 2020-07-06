const babelJest = require('babel-jest')

module.exports = babelJest.createTransformer({
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        bugfixes: true,
        shippedProposals: true,
        targets: {
          node: 'current',
        },
      },
    ],
    require.resolve('@babel/preset-typescript'),
  ],
  plugins: [
    require('@snowpack/app-scripts-svelte/jest/importMetaBabelPlugin'),
    require.resolve('babel-plugin-dynamic-import-node'),
  ],
})
