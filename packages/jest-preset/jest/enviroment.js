/* eslint-env node */
const { init, parse } = require('es-module-lexer')

Object.defineProperty(global, '__ES_MODULE_LEXER__PARSE', {
  value: parse,
})

module.exports = function Enviroment(config, context) {
  const BaseEnviroment =
    context.docblockPragmas.env === 'node' ||
    require('@carv/bundle/lib/package-manifest').browser === false
      ? require('jest-environment-node')
      : context.docblockPragmas.env === 'jsdom' ||
        require('@carv/bundle/lib/package-manifest').browser !== false
      ? require('jest-environment-jsdom-sixteen')
      : require('jest-environment-node')

  class Enviroment extends BaseEnviroment {
    async setup() {
      await init

      Object.defineProperty(this.global, '__ES_MODULE_LEXER__PARSE', {
        value: parse,
      })

      if (this.dom) {
        const { Crypto } = require('@peculiar/webcrypto')
        this.global.crypto = new Crypto()

        this.global.fetch = require('cross-fetch')
      }

      return super.setup()
    }
  }

  return new Enviroment(config, context)
}
