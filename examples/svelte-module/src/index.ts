// TODO import load should work in VS code
import Hello, { load } from './hello.svelte'

export { load }
export default Hello

if (import.meta.hot) {
  document.body.innerHTML = ''
  const app = new Hello({
    target: document.body,
  })

  import.meta.hot?.dispose(() => {
    app.$destroy()
  })
}
