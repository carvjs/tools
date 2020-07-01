const path = require('path')

const nodeMajorVersion = process.versions.node.split('.')[0]

module.exports = {
  prepare() {
    if (this.outDir === process.cwd()) {
      throw this.createError(`You can't create a new project in current directory`)
    }

    if (nodeMajorVersion < 12) {
      throw this.createError(
        `You are running Node v${process.versions.node}.\nCreate Carv requires Node 12 or higher.\nPlease update your version of Node.`,
      )
    }
  },
  prompts() {
    return [
      {
        name: 'projectScope',
        message: 'What is the npm scope of your company (usually the company name)? [optional]',
        store: true,
        default: '',
        filter: (name) =>
          name && (name.startsWith('@') ? name.toLowerCase() : `@${name.toLowerCase()}`),
        validate: (name) =>
          name === '' || require('validate-npm-package-name')(`${name}/x`).validForNewPackages,
      },
      {
        name: 'projectName',
        message: 'What is the name of the new project?',
        default: this.outFolder,
        filter: (name) => name.toLowerCase(),
        validate: (name) => require('validate-npm-package-name')(name).validForNewPackages,
        required: true,
      },
      {
        name: 'description',
        message: 'How would you describe the new project? [optional]',
        default: ``,
      },
      {
        name: 'author',
        message: 'What is your name?',
        default: process.env.npm_config_init_author_name || this.gitUser.name,
        store: true,
        required: true,
      },
      {
        name: 'email',
        message: 'What is your email?',
        default: process.env.npm_config_init_author_email || this.gitUser.email,
        validate: (v) => /.+@.+/.test(v),
        store: true,
      },
      {
        name: 'starter',
        message: 'What do you want build?',
        type: 'list',
        choices: [
          {
            name: 'Workflow Form',
            value: 'form',
          },
          {
            name: 'Extension Point',
            value: 'extension',
          },
          {
            name: 'Component Library',
            value: 'components',
          },
        ],
        required: true,
      },
      {
        name: 'typescript',
        message: 'Do you want to use Typescript?',
        type: 'confirm',
        default: false,
      },
      {
        name: 'npmClient',
        message: 'Choose an npm client for installing packages:',
        type: 'list',
        default: this.npmClient,
        store: true,
        choices: [
          {
            name: 'NPM',
            value: 'npm',
          },
          {
            name: 'Yarn',
            value: 'yarn',
          },
        ],
        required: true,
      },
      {
        name: 'registry',
        message: 'Which npm registry to use for installing packages? [blank for npmjs.org]',
        filter: (registry) => defaultRegistryBlank(registry),
        default: () => defaultRegistryBlank(require('registry-url')()),
        validate: isValidRegistryURL,
      },
      {
        name: 'publishRegistry',
        message: 'Which npm registry to use for publishing? [blank for npmjs.org]',
        filter: (publishRegistry, { registry } = {}) =>
          defaultRegistryBlank(publishRegistry, registry),
        default: ({ projectScope, registry }) =>
          defaultRegistryBlank(require('registry-url')(projectScope), registry),
        validate: isValidRegistryURL,
      },
    ]
  },
  actions() {
    const {
      projectScope,
      projectName,
      description,
      author,
      email,
      starter,
      typescript,
      npmClient,
      registry,
      publishRegistry,
    } = this.answers

    this.sao.opts.npmClient = require('sao/lib/installPackages').setNpmClient(npmClient)
    this.sao.opts.registry = registry

    const svelte = ['form', 'extension', 'components'].includes(starter)
    const preview = ['form', 'extension', 'components'].includes(starter)

    const packageName = projectScope ? `${projectScope}/${projectName}` : projectName
    const templateData = {
      nodeMajorVersion,
      packageName,
      extname: typescript ? '.ts' : '.js',
    }

    return [
      {
        type: 'add',
        templateDir: 'templates/main',
        files: '**',
        templateData,
      },
      typescript && {
        type: 'add',
        templateDir: `templates/typescript`,
        files: '**',
        filters: {
          'package.json': false,
          '.vscode/extensions.json': false,
        },
        templateData,
      },
      svelte && {
        type: 'add',
        templateDir: `templates/svelte`,
        files: '**',
        filters: {
          'package.json': false,
          '.vscode/extensions.json': false,
        },
        templateData,
      },
      preview && {
        type: 'add',
        templateDir: `templates/preview`,
        files: '**',
        filters: {
          'package.json': false,
          '.vscode/extensions.json': false,
        },
        templateData,
      },
      {
        type: 'add',
        templateDir: `templates/${starter}`,
        files: '**',
        filters: {
          'package.json': false,
          '.vscode/extensions.json': false,
        },
        templateData,
      },
      {
        type: 'add',
        templateDir: `templates/${starter}-${typescript ? 'ts' : 'js'}`,
        files: '**',
        filters: {
          'package.json': false,
          '.vscode/extensions.json': false,
        },
        templateData,
      },
      {
        type: 'move',
        patterns: {
          _gitignore: '.gitignore',
        },
      },
      {
        type: 'modify',
        files: 'package.json',
        handler: (manifest) => {
          manifest.name = packageName
          if (description) manifest.description = description
          manifest.author = email ? `${author} <${email}>` : author

          const packageJsons = [
            require(`./templates/main/package.json`),
            typescript && require('./templates/typescript/package.json'),
            svelte && require('./templates/svelte/package.json'),
            preview && require('./templates/preview/package.json'),
            require(`./templates/${starter}/package.json`),
            require(`./templates/${starter}-${typescript ? 'ts' : 'js'}/package.json`),
          ].filter(Boolean)

          for (const pkg of packageJsons) {
            for (const [key, value] of Object.entries(pkg)) {
              if (/dependencies/i.test(key)) {
                manifest[key] = {
                  ...manifest[key],
                  ...value,
                }
              } else {
                manifest[key] = value
              }
            }
          }

          manifest.publishConfig = {
            access: 'public',
            registry: registry !== publishRegistry ? publishRegistry : undefined,
          }

          return manifest
        },
      },
      {
        type: 'modify',
        files: '.vscode/extensions.json',
        handler: (manifest) => {
          const recommendations = new Set(
            [
              require(`./templates/main/.vscode/extensions.json`),
              typescript && require('./templates/typescript/.vscode/extensions.json'),
              svelte && require('./templates/svelte/.vscode/extensions.json'),
            ]
              .filter(Boolean)
              .map((extensions) => extensions.recommendations),
          )

          manifest.recommendations = [...recommendations]

          return manifest
        },
      },
    ].filter(Boolean)
  },
  async completed() {
    this.gitInit()

    await this.npmInstall()

    try {
      await require('execa')(this.npmClient, ['run', 'format'], {
        cwd: this.outDir,
        stdio: 'inherit',
      })
    } catch (error) {
      throw new SAOError(error.message)
    }

    try {
      await require('execa')(this.npmClient, ['test'], { cwd: this.outDir, stdio: 'inherit' })
    } catch (error) {
      throw new SAOError(error.message)
    }

    console.log()
    this.showProjectTips()

    const cdOutDir = () =>
      this.outDir == process.cwd()
        ? ''
        : `${this.chalk.bold('cd')} ${this.chalk.cyan(
            path.relative(process.cwd(), this.outDir),
          )} && `

    console.log()
    this.logger.tip(
      `To start dev server, run: ${cdOutDir()}${this.chalk.bold(this.npmClient)} ${this.chalk.cyan(
        'start',
      )}`,
    )

    console.log()
    this.logger.tip(
      `To test the code, run: ${cdOutDir()}${this.chalk.bold(this.npmClient)} ${this.chalk.cyan(
        'test',
      )}`,
    )
  },
}

function isValidRegistryURL(value) {
  try {
    new URL(value)
    return true
  } catch (_) {
    return false
  }
}

function defaultRegistryBlank(value, fallback = 'https://registry.npmjs.org/') {
  return value || fallback
}
