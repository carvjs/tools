const path = require('path')
const cli = require('cac')()

cli
  .command('<target-folder>', 'Generate a new project to target folder')
  .option('--info', 'print environment debug info')
  .action(async (targetFolder, { info }) => {
    if (info) {
      const chalk = require('chalk')
      console.log(chalk.bold('\nEnvironment Info:'))
      console.log(`\n  current version of ${pkg.name}: ${pkg.version}`)
      console.log(`  running from ${__dirname}`)

      await require('envinfo')
        .run(
          {
            System: ['OS', 'Shell'],
            Binaries: ['Node', 'npm', 'Yarn'],
            Utilities: ['Git'],
            Browsers: [
              'Brave Browser',
              'Chrome',
              'Chrome Canary',
              'Edge',
              'Firefox',
              'Firefox Developer Edition',
              'Internet Explorer',
              'Safari',
              'Safari Technology Preview',
            ],
            IDEs: ['Atom', 'Sublime Text', 'VSCode', 'Vim'],
            npmPackages:
              '{*carv*,@carv/*,*testing-library*,*jest*,@jest/*,*snowpack*,@snowpack/*,*svelte*}',
            Monorepos: ['Yarn Workspaces', 'Lerna'],
          },
          {
            duplicates: true,
            showNotFound: true,
          },
        )
        .then(console.log)
    }

    // if (!targetFolder) {
    //   console.error('Please specify the target-folder:')
    //   console.log(`  ${chalk.cyan(program.name())} ${chalk.green('<target-folder>')}`)
    //   console.log()
    //   console.log('For example:')
    //   console.log(`  ${chalk.cyan(cli.name)} ${chalk.green('my-carv-project')}`)
    //   console.log()
    //   console.log(`Run ${chalk.cyan(`${cli.name} --help`)} to see all options.`)
    //   process.exit(1)
    // }
    const sao = require('sao')

    const app = sao({
      generator: path.join(__dirname, '..', 'generator'),
      outDir: targetFolder,
      npmClient: detectNpmClient(),
      updateCheck: false,
    })

    await app.run().catch(sao.handleError)
  })

cli.on('command:!', () => {
  if (!cli.args.length) cli.outputHelp()
})

cli.help()
cli.version(require('../package').version)
cli.parse()

function detectNpmClient() {
  // $ yarn env | grep npm_execpath
  // "npm_execpath": ".../.nvm/versions/node/v14.2.0/lib/node_modules/yarn/bin/yarn.js",
  //
  // $ npm run env | grep npm_execpath
  // npm_execpath=.../.nvm/versions/node/v14.2.0/lib/node_modules/npm/bin/npm-cli.js

  const npmPath = process.env.npm_execpath || ''

  if (npmPath.includes('/node_modules/yarn/')) {
    return 'yarn'
  }

  return 'npm'
}
