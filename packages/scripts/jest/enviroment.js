/* eslint-env node */
const { init, parse } = require('es-module-lexer')

Object.defineProperty(global, '__ES_MODULE_LEXER__PARSE', {
  value: parse,
})

// eslint-disable-next-line func-names
module.exports = function Enviroment(config, context) {
  const BaseEnviroment =
    context.docblockPragmas.env === 'jsdom' || require('../lib/use').browser
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
