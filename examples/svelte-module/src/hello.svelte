<script lang="ts">
  import Paper, { Title, Subtitle, Content } from '@smui/paper'

  import favicon from './favicon.ico'

  export let name: string = 'world'
</script>

<Paper>
  <Title>Paper</Title>
  <Subtitle>This is a sheet of paper.</Subtitle>
  <Content>Paper is used to build an elevated surface.</Content>
</Paper>

<h1>Hello {name}!</h1>

<svelte:head>
  <link rel="icon" href={favicon} type="image/x-icon" />
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
