<script lang="typescript">
  import { getFormupContext } from 'svelte-formup'

  export let at: string

  const { touched, errors } = getFormupContext()

  let error: Error

  $: error = $errors.get(at)
</script>

{#if $touched.has(at) && error}
  <span class="error" aria-live="polite">
    <slot {error}>{error.message}</slot>
  </span>
{/if}

<style>
  .error {
    color: red;
  }
</style>
