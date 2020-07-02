/**
 * Declarations of untyped node modules
 *
 * ```
 * declare module 'untyped-module`;
 * ```
 *
 * Or being specific:
 *
 * ```
 * declare module 'untyped-module` {
 *   import x from 'x'
 *
 *   const y: ReturnType<x>
 *   export default y
 * }
 * ```
 */
