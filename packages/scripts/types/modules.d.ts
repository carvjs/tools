declare module 'fake-tag' {
  function tag(strings: TemplateStringsArray, ...values: string[]): string

  export default tag
}

declare module 'plain-tag' {
  function tag(strings: TemplateStringsArray, ...values: string[]): string

  export default tag
}
