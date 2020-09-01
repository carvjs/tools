import Hello from './hello.svelte'

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
