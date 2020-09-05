<script>
  import { Component } from '../main'

  import favicon from './favicon.png'
</script>

<svelte:head>
  <title>Components Preview</title>
  <link rel="icon" type="image/png" href={favicon} />
</svelte:head>

<main class="app">
  <Component />
</main>

<style src="./app.css">
</style>
