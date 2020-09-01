<script>
  import favicon from './favicon.ico'

  const icon = favicon
  export let name = 'world'
</script>

<h1>Hello {name}!</h1>

<svelte:head>
  <link rel="icon" href={icon} type="image/x-icon" />
</svelte:head>

{#if process.env.NODE_ENV === 'development'}
  <p>{process.env.NODE_ENV} environment!</p>
{/if}

<style>
  @import '~spectre.css';
  @import './spectre-addons.css';

  h1 {
    font-family: system-ui;
    color: red;
  }
</style>
