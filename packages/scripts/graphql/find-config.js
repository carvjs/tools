/* eslint-env node */

module.exports = (projectRootPath) => {
  // Like https://graphql-config.com/usage#config-search-places
  // https://github.com/kamilkisiela/graphql-config/blob/254dd12daaa73a72b149d63da5f77030979a2d5c/src/helpers/cosmiconfig.ts#L64
  const graphql = require('cosmiconfig')
    .cosmiconfigSync('graphql', {
      searchPlaces: [
        `#.config.js`,
        '#.config.json',
        '#.config.yaml',
        '#.config.yml',
        '.#rc',
        '.#rc.js',
        '.#rc.json',
        '.#rc.yml',
        '.#rc.yaml',
        'package.json',
      ].map((place) => place.replace('#', 'graphql')),
    })
    .search(projectRootPath)

  // schema: 'schema.graphql'
  // endpoint:
  //   url: '<graphql-api-url>'
  //   method: 'GET'
  //   headers:
  //     auth: Basic <public-key>

  return graphql?.config
}
