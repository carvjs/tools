module.exports = (projectRootPath) => {
  const config = require('./find-config')(projectRootPath)

  if (config) {
    // prefer local schema over remote url
    return {
      url: config.schema || config.url,
    }
  }

  console.error('!!! No graphql configuration found.')
}
