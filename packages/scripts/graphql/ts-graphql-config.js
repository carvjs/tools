/* eslint-env node */

const fs = require('fs/promises')
const path = require('path')

const cache = new Map()

module.exports = async (projectRootPath) => {
  let result = cache.get(projectRootPath)

  if (!result) {
    result = await load(projectRootPath)
    cache.set(projectRootPath, result)
  }

  if (result.schema) {
    return { url: await serveSchema(result.schema) }
  }

  return result
}

async function load(projectRootPath) {
  const config = require('../lib/config').graphql

  if (!config) {
    console.error('!!! No graphql configuration found.')
    return {}
  }

  // Prefer local schema over remote url
  const url = config.schema || config.endpoint

  if (/^https?:\/\//.test(url)) {
    // Try to download and cache the schema
    const cacheFile = path.join(
      projectRootPath,
      'node_modules',
      '.cache',
      'ts-graphql-config',
      `${url.replace(/[:/]/g, '_')}.json`,
    )
    let schema
    try {
      schema = await requestIntrospectionQuery(url, { timeout: 1500 })

      await fs.mkdir(path.dirname(cacheFile), { recursive: true })
      await fs.writeFile(cacheFile, schema)
    } catch (error) {
      // If that fails use previously cached schema
      console.warn(`Failed to reach graphql endpoint at ${url}: ${error.message}`)
      try {
        schema = await fs.readFile(cacheFile)
        console.warn(` => Using schema from cache`)
      } catch {}
    }

    if (schema) {
      return { schema }
    }

    // The remote is not available and we have no cache
    return { url }
  }

  // This is a local schema
  try {
    const schema = await fs.readFile(path.resolve(projectRootPath, url), { encoding: 'utf-8' })

    return { schema }
  } catch {
    return { url }
  }
}

async function serveSchema(schema) {
  const server = require('http').createServer((request, response) => {
    response.end(schema)
    server.close()
  })
  server.unref()

  // TODO use p-event
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

    const { request: fetch } = require(url.startsWith('https:') ? 'https' : 'http')

    let body = ''

    const request = fetch(
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
      (response) => {
        response.on('data', (chunk) => {
          body += chunk
        })

        response.on('end', () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode > 300) {
            reject(new Error(`Failed with ${response.statusCode}`))
          } else {
            resolve(body)
          }
        })
      },
    )

    request.on('error', (reason) => reject(reason))
    request.write(INTROSPECTION_QUERY_BODY)
    request.end()
  })
}
