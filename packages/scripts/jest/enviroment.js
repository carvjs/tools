/* eslint-env node */
const { init, parse } = require('es-module-lexer')

Object.defineProperty(global, '__ES_MODULE_LEXER__PARSE', {
  value: parse,
})

module.exports = function Enviroment(config, context) {
  const BaseEnviroment =
    context.docblockPragmas.env === 'jsdom' || require('../lib/package-manifest').browser !== 'false'
      ? require('jest-environment-jsdom-sixteen')
      : require('jest-environment-node')

  class Enviroment extends BaseEnviroment {
    async setup() {
      await init

      Object.defineProperty(this.global, '__ES_MODULE_LEXER__PARSE', {
        value: parse,
      })

      return super.setup()
    }
  }

  return new Enviroment(config, context)
}
