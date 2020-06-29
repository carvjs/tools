const path = require('path')
const fs = require('fs')
const { createHash } = require('crypto')

const THIS_FILE = fs.readFileSync(__filename)

const content = `
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = require(${JSON.stringify(require.resolve('identity-obj-proxy'))});
`

module.exports = {
  process() {
    return content
  },
  getCacheKey() {
    return createHash('md5').update(THIS_FILE).update('\0', 'utf8').update(content).digest('hex')
  },
}
