const path = require('path')
const fs = require('fs')
const { createHash } = require('crypto')

const THIS_FILE = fs.readFileSync(__filename)

module.exports = {
  process(src, filename) {
    return `
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = ${JSON.stringify(path.basename(filename))};
    `
  },
  getCacheKey(fileData, filename, configString, cacheKeyOptions) {
    const { rootDir } = cacheKeyOptions
    return createHash('md5')
      .update(THIS_FILE)
      .update('\0', 'utf8')
      .update(path.relative(rootDir, filename))
      .digest('hex')
  },
}
