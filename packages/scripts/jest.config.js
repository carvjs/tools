const preset = require('./jest-preset')

module.exports = {
  ...preset,
  testMatch: ['<rootDir>/test/*.test.js'],
}
