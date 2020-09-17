/* eslint-env node */

const path = require('path')

exports['.css'] = async ({ code, id, target, minify, dev, modules, resolveFile }) => {
  let classNames
  const output = await require('postcss')(
    [
      resolveFile && require('./postcss-assets')({ resolveFile }),

      require('postcss-nested')(),

      modules &&
        require('postcss-modules')({
          generateScopedName: minify && !dev ? '__[sha256:hash:base62:11]' : '__[local]__[sha256:hash:base62:8]',
          getJSON: (cssFileName, json) => {
            classNames = json
          },
        }),

      target !== 'esnext' &&
        require('postcss-preset-env')({
          browsers: require('@carv/polyfills').getBrowserlistForTarget(target),
          // https://preset-env.cssdb.org/features#stage-2
          stage: 2,
          // https://github.com/csstools/postcss-preset-env/blob/master/src/lib/plugins-by-id.js#L36
          features: {
            'any-link-pseudo-class': false,
            'case-insensitive-attributes': false,
            'dir-pseudo-class': false,
            'gray-function': false,
          },
          autoprefixer: {
            // https://github.com/postcss/autoprefixer#options
            grid: true,
          },
        }),

      minify &&
        require('cssnano')({
          preset: require('cssnano-preset-default')({
            calc: false,
            convertValues: false,
            orderedValues: false,
            discardOverridden: false,
            discardDuplicates: false,
            cssDeclarationSorter: false,
          }),
        }),
    ].filter(Boolean),
  ).process(code, {
    from: id,
    to: id,
    map: {
      inline: true,
    },
  })

  return {
    code: output.css,
    warnings: output.warnings(),
    classNames,
  }
}

exports['.scss'] = async (options) => {
  const result = require('sass').renderSync({
    file: options.id,
    data: options.code,
    outFile: options.id,
    includePaths: [
      path.join(require('./package-paths').source, 'theme'),
      ...require('./include-paths'),
    ],
    sourceMap: true,
    sourceMapContents: true,
    sourceMapEmbed: true,
  })

  return {
    ...(await exports['.css']({ ...options, code: result.css.toString() })),
    dependencies: result.stats.includedFiles,
  }
}
