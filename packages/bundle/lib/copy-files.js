/* eslint-env node */

const fs = require('fs-extra')
const path = require('path')
const globby = require('globby')
const paths = require('./package-paths')

module.exports = async function copyFiles(target = paths.dist) {
  const manifest = require('./package-manifest')

  // TODO copy additional exports
  console.time('Copyied common package files to ' + path.relative(process.cwd(), target))

  await fs.mkdirp(target)

  /**
   * Copy readme, license, changelog to dist
   */
  const files = await globby(
    [
      ...(manifest.files || []),
      '{changes,changelog,history,license,licence,notice,readme}?(.md|.txt)',
    ],
    {
      cwd: paths.root,
      absolute: false,
      gitignore: true,
      caseSensitiveMatch: false,
      dot: true,
    },
  )

  await Promise.all(files.map((file) => fs.copy(file, path.join(target, file))))

  console.timeEnd('Copyied common package files to ' + path.relative(process.cwd(), target))
}
