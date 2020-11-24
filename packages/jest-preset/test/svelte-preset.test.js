/**
 * @env jsdom
 */

import { render, screen } from '@testing-library/svelte'

test('hello svelte', async () => {
  const { default: Hello } = await import('./fixtures/hello.svelte')

  expect(Hello.toString()).toInclude('class Hello extends SvelteComponentDev')

  await render(Hello)

  expect(screen.getByRole('heading')).toHaveTextContent('Hello world!')
})
