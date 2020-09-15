/* eslint-env node */

const fs = require('fs-extra')
const path = require('path')
const globby = require('globby')

// Idea:
// - create *.svelte.d.ts files
// - generate typescript declarations in a build directory using tsc
// - remove created *.svelte.d.ts files
// - use rollup-plugin-dts to create final bundle
module.exports = async function* createSvelteTSx(cwd) {
  // Collect all svelte files
  const svelteFiles = await globby('**/*.svelte', {
    cwd,
    gitignore: true,
    absolute: true,
  })

  if (svelteFiles.length === 0) return

  // Copy the jsx shim definitions
  const jsxFileName = path.resolve(cwd, '__svelte-jsx.d.ts')

  const jsx = await fs.readFile(require.resolve('svelte2tsx/svelte-jsx.d.ts'), 'utf-8')

  await fs.writeFile(
    jsxFileName,
    // Copy svelte-jsx as namespace JSX
    jsx
      .replace('declare namespace svelte.JSX', 'declare namespace JSX')
      .replace('/* children?: Children;', 'children?: Children;')
      .replace('ref?: ((e: T) => void) | Ref<T>; */', '/* ref?: ((e: T) => void) | Ref<T>; */')
  )

  yield {fileName: jsxFileName, isShim: true}

  /// Copy svelte-shim
  const shimFileName = path.resolve(cwd, '__svelte-shims.d.ts')

  const shim = await fs.readFile(require.resolve('svelte2tsx/svelte-shims.d.ts'), 'utf-8')

  // Set of exported shim declarations
  const exports = new Set()

  // Remove declare module '*.svelte' {}
  // and export all definitions
  const additionalHelpers = [
    `declare function __sveltets_default<T>(): T;`,
  ].join('\n')

  await fs.writeFile(
    shimFileName,
    (shim.slice(shim.indexOf('}') + 1) + '\n' + additionalHelpers)
      .replace(/^(declare\s+(?:class|function)|type)\s+(\S+?)\b/gm, (match, type, name) => {
        exports.add(name)
        return `export ${match}`
      }),

  )

  yield {fileName: shimFileName, isShim: true}

  // Import all exports, rollup dts will treeshake them for us
  const imports = [...exports].join(', ')

  // Create tsx shim for each svelte
  const svelte2tsx = require('svelte2tsx')

  for await (const svelteFile of svelteFiles) {
    const source = await fs.readFile(svelteFile, 'utf-8')

    const result = svelte2tsx(source, {
      filename: svelteFile,
      strictMode: false,
      isTsFile: true,
    })

    // Add shim import without .d.ts extension
    let shimImport = path.relative(path.dirname(svelteFile), shimFileName.slice(0, -5))
    if (!(shimImport.startsWith('./') || shimImport.startsWith('../'))) {
      shimImport = './' + shimImport
    }

    const svelteFileJsx = svelteFile + '.tsx'

    const code = result.code
      // Replace store access using $store with type
      // ignore: $$restProps, $$props, $:, _$$p, .$on, ${
      .replace(/(?<![$.])\$([\w]+?)\b/gmu, '__sveltets_store_get($1)')
      // Ensure not initalized exports are typed
      .replace(/\b(let\s+[\w]+\s*:[^=;]+?)(;|$)/gmu, '$1 = __sveltets_default()$2')
      // Move render body outside to have access to internal types like ComponentEvents
      .replace('function render() {', '')
      .replace(/(<\/>\);[\r?\n])(\s*return\s*{\s*props:\s*{)/m, '$1function render() {\n$2')

    await fs.writeFile(
      svelteFileJsx,
      [code, `import {${imports}} from ${JSON.stringify(shimImport)}`].join('\n'),
    )

    yield {fileName: svelteFileJsx, isShim: false}
  }
}
