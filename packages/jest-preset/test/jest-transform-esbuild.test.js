/* eslint-env node */
import path from 'path'
import fs from 'fs/promises'

import transformer from '../jest/transform-esbuild.js'

test('esbuild', async () => {
  const filename = path.join(__dirname, 'fixtures', 'a.js')
  const result = transformer.process(await fs.readFile(filename, 'utf-8'), filename)

  expect(result.code).not.toContain('esbuildCommandAndArgs')
  expect(result.code).toContain('require("x")')
  expect(result.code).toContain('require("./b")')
})

test('import json', async () => {
  const result = await import('./fixtures/data.json')

  expect(result).toStrictEqual({
    data: 'json',
    default: { data: 'json' },
  })
})

test('import svelte', async () => {
  const result = await import('./fixtures/import-svelte')

  expect(result.Hello).toBeFunction()
})

// Test('import dynamic js', async () => {
//   let key = 'meta'
//   const result = await import(`./fixtures/${key}.js`)

//   expect(result).toStrictEqual({
//     data: 'json',
//     default: { data: 'json' },
//   })
// })
