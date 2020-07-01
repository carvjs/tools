<script>
  import Extension from '../main.svelte'

  import favicon from './favicon.png'
</script>

<svelte:head>
  <title>Form Preview</title>
  <link rel="icon" type="image/png" href={favicon} />
</svelte:head>

<main class="app">
  <Extension />
</main>

<style src="./app.css">

</style>
