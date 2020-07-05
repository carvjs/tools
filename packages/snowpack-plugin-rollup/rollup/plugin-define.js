import path from 'path'
import { createFilter } from '@rollup/pluginutils'
import MagicString from 'magic-string'
import astMatcher from 'ast-matcher'

export default function carvDefine({
  include = ['**/*.{svelte,tsx,ts,mjs,jsx,js,cjs}'],
  exclude = /\/node_modules\//,
  verbose = false,
  ...replacements
} = {}) {
  const filter = createFilter(include, exclude)

  const keys = Object.keys(replacements)
  let matchers

  return {
    name: 'carv:define',
    transform,
    renderChunk: (code, chunk) => transform(code, chunk.fileName),
  }

  async function transform(code, id) {
    if (!keys.length) return null
    if (!filter(id)) return null

    const parse = (code, source = code) => {
      try {
        return this.parse(code)
      } catch (error) {
        error.message += ` in ${source}`
        throw error
      }
    }

    const ast = parse(code, id)

    if (!matchers) {
      matchers = keys.map((key) => astMatcher(parse(key)))
    }

    const magicString = new MagicString(code)
    const edits = []

    matchers.forEach((matcher, index) => {
      for (const { node } of matcher(ast) || []) {
        let replacement = replacements[keys[index]]
        if (typeof replacement === 'function') replacement = replacement(id)

        if (markEdited(node, edits)) {
          magicString.overwrite(node.start, node.end, replacement)

          if (verbose) {
            console.log(`[${path.relative(process.cwd(), id)}]`, keys[index], '=>', replacement)
          }
        } else {
          console.warn(
            `[${path.relative(process.cwd(), id)}] pattern ${
              keys[index]
            } has already been edited, skipping this change. ` +
              `This usually means you should re-order the patterns.`,
          )
        }
      }
    })

    if (edits.length === 0) return null

    return {
      code: magicString.toString(),
      map: magicString.generateMap({ source: code, includeContent: true, hires: true }),
    }
  }
}

function markEdited(node, edits) {
  for (const [start, end] of edits) {
    if ((start <= node.start && node.start < end) || (start < node.end && node.end <= end)) {
      return false // already edited
    }
  }

  // not edited
  return edits.push([node.start, node.end])
}
