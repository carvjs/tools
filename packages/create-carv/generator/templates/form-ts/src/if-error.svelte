<script lang="typescript">
  import { getFormupContext } from 'svelte-formup'

  export let at: string

  const { invalid } = getFormupContext()

  let error: Error | undefined

  $: error = $invalid.get(at)
</script>

{#if error}
  <span class="error" aria-live="polite">
    <slot {error}>{error.message}</slot>
  </span>
{/if}

<style>
  .error {
    color: red;
  }
</style>
