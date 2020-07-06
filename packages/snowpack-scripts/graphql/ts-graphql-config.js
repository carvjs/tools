const { promises: fs } = require('fs')
const path = require('path')

module.exports = async (projectRootPath) => {
  const config = require('./find-config')(projectRootPath)

  if (!config) {
    console.error('!!! No graphql configuration found.')
    return
  }

  // Prefer local schema over remote url
  let url = config.schema || config.endpoint

  if (/^https?:\/\//.test(url)) {
    // Try to download and cache the schema
    const cacheFile = path.join(
      projectRootPath,
      'node_modules',
      '.cache',
      'ts-graphql-config',
      `${url.replace(/[:\/]/g, '_')}.json`,
    )
    let schema
    try {
      schema = await requestIntrospectionQuery(url, { timeout: 500 })

      await fs.mkdir(path.dirname(cacheFile), { recursive: true })
      await fs.writeFile(cacheFile, schema)
    } catch (error) {
      // If that fails use previously cached schema
      console.warn(error)
      try {
        schema = await fs.readFile(cacheFile)
      } catch (_) {}
    }

    if (schema) {
      return { url: await serveSchema(schema) }
    }

    // The remote is not available and we have no cache
    return { url }
  }

  // This is a local schema
  try {
    const schema = await fs.readFile(path.resolve(projectRootPath, url), { encoding: 'utf-8' })

    return { url: await serveSchema(schema) }
  } catch (_) {
    return { url }
  }
}

async function serveSchema(schema) {
  const server = require('http').createServer((req, res) => {
    res.end(schema)
    server.close()
  })
  server.unref()

  await new Promise((resolve) => server.listen(0, resolve))

  const { port } = server.address()

  return `http://localhost:${port}`
}

// Based on https://github.com/Quramy/ts-graphql-plugin/blob/master/src/schema-manager/request-introspection-query.ts
function requestIntrospectionQuery(url, { headers = {}, ...options } = {}) {
  return new Promise((resolve, reject) => {
    const INTROSPECTION_QUERY_BODY = JSON.stringify({
      query: require('graphql').getIntrospectionQuery(),
    })

    const { request } = require(url.startsWith('https:') ? 'https' : 'http')
    let body = ''

    const req = request(
      url,
      {
        ...options,
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(INTROSPECTION_QUERY_BODY),
          'User-Agent': 'ts-graphql-plugin',
          ...headers,
        },
      },
      (res) => {
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode > 300) {
            reject({
              statusCode: res.statusCode,
              body,
            })
          } else {
            resolve(body)
          }
        })
      },
    )

    req.on('error', (reason) => reject(reason))
    req.write(INTROSPECTION_QUERY_BODY)
    req.end()
  })
}
