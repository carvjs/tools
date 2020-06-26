const fs = require('fs')
const path = require('path')
const execa = require('execa')
const npmRunPath = require('npm-run-path')

const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates')

const templates = fs.readdirSync(TEMPLATES_DIR)

const cleanup = () => fs.promises.rmdir(path.resolve(__dirname, 'testdata'), { recursive: true })

describe('npx create-snowpack-app', () => {
  beforeAll(cleanup)
  afterAll(cleanup)

  templates.forEach((template) => {
    it(`--template @snowpack/${template}`, async () => {
      // run yarn in this directory
      await execa('yarn', { cwd: path.join(TEMPLATES_DIR, template) })

      // run the create-snowpack-app bin
      await execa(
        'create-snowpack-app',
        [
          `test/testdata/${template}`,
          '--template',
          `../../../templates/${template}`, // this is relative to the new app in testdata/, not this file
          '--use-yarn', // we use Yarn for this repo
          '--force', // saves you from having to manually delete things
        ],
        { cwd: path.resolve(__dirname, '..'), ...npmRunPath.env() },
      )

      const packageJsonExists = fs.existsSync(
        path.resolve(__dirname, 'testdata', template, 'package.json'),
      )
      expect(packageJsonExists).toBe(true)
    })
  })
})
