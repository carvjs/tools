<script>
  import Form from '../form.svelte'

  import favicon from './favicon.png'
</script>

<svelte:head>
  <title>Form Preview</title>
  <link rel="icon" type="image/png" href={favicon} />
</svelte:head>

<main class="app">
  <Form />
</main>

<style>
  :global(body) {
    color: #333;
    background-color: #f3f3f3;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu,
      Cantarell, 'Helvetica Neue', sans-serif;
  }

  .app {
    max-width: 50em;
    margin: 5rem auto;
  }

  :global(form:invalid) {
    border: 5px solid #ffdddd;
  }

  :global(form:valid) {
    border: 5px solid #ddffdd;
  }

  :global(p > label) {
    display: block;
  }

  :global(input[type='text'], input[type='email'], input[type='number'], textarea, fieldset) {
    width: 100%;
    border: 1px solid #333;
    box-sizing: border-box;
  }

  :global(input:invalid, select:invalid) {
    box-shadow: 0 0 5px 1px red;
  }

  :global(input:focus:invalid, select:focus:invalid) {
    box-shadow: none;
  }
</style>
