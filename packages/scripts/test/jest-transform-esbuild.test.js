import path from 'path'
import fs from 'fs/promises'

import transformer from '../jest/transform-esbuild.js'

test('esbuild', async () => {
  const filename = path.join(__dirname, 'fixtures', 'a.js')
  const result = transformer.process(await fs.readFile(filename, 'utf-8'), filename)

  expect(result).not.toContain('esbuildCommandAndArgs')
  expect(result).toContain('require("x")')
  expect(result).toContain('require("../../test/fixtures/b")')
})

test('import json', async () => {
  const result = await import('./fixtures/data.json')

  expect(result).toStrictEqual({
    data: 'json',
    default: { data: 'json' },
  })
})

// Test('import dynamic js', async () => {
//   let key = 'meta'
//   const result = await import(`./fixtures/${key}.js`)

//   expect(result).toStrictEqual({
//     data: 'json',
//     default: { data: 'json' },
//   })
// })
