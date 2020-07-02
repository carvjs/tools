const path = require('path')
const sao = require('sao')

const generator = path.join(__dirname, '..')

test.each([
  ['npm', { typescript: false }],
  ['npm', { typescript: true }],
  ['yarn', { typescript: false }],
  ['yarn', { typescript: true }],
])('extension (%s): %j', async (npmClient, answers) => {
  const stream = await sao.mock(
    { generator, npmClient },
    {
      starter: 'extension',
      ...answers,
    },
  )

  expect(stream.fileList).toIncludeAllMembers([
    '.editorconfig',
    '.gitattributes',
    '.gitignore',
    '.npmrc',
    '.nvmrc',
    '.vscode/extensions.json',
    'CHANGELOG.md',
    'README.md',
    'package-scripts.js',
    'package.json',
    'src/__preview__/app.css',
    'src/__preview__/app.svelte',
    'src/__preview__/favicon.png',
    'src/main.svelte',
    'svelte.config.js',
  ])

  const pkg = JSON.parse(await stream.readFile('package.json'))

  const dependencies = [...Object.keys(pkg.dependencies || [])]
  const devDependencies = [...Object.keys(pkg.devDependencies)]

  expect(dependencies).toIncludeAllMembers(['svelte'])

  expect(devDependencies).toIncludeAllMembers([
    '@carv/eslint-config',
    '@carv/prettier-config',
    '@carv/snowpack-scripts',
    'doctoc',
    'envinfo',
    'eslint',
    'jest',
    'nps',
    'prettier',
    'snowpack',
    '@testing-library/svelte',
    '@testing-library/user-event',
    'svelte-check',
    'svelte-htm',
  ])

  if (answers.typescript) {
    expect(stream.fileList).toIncludeAllMembers([
      'src/__preview__/start.ts',
      'src/__tests__/main.test.ts',
      'src/types/index.ts',
      'tsconfig.json',
    ])

    expect(devDependencies).toIncludeAllMembers(['@carv/types', 'typescript'])
  } else {
    expect(stream.fileList).toIncludeAllMembers([
      'src/__preview__/start.js',
      'src/__tests__/main.test.js',
    ])
  }
})
