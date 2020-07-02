declare module 'fake-tag' {
  function tag(strings: TemplateStringsArray, ...values: string[]): string

  export default tag
}
