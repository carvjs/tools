<script>
  export let name = 'world'
</script>

<h1>Hello {name}!</h1>

{#if process.env.NODE_ENV !== 'development'}
  <p>{process.env.NODE_ENV} environment!</p>
{/if}

<style>
  h1 {
    font-family: system-ui;
  }
</style>
