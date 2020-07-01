import { render, screen } from '@testing-library/svelte'
import Component from '../component.svelte'

test('renders the Component', () => {
  render(Component)

  const heading = screen.getByRole('heading')

  expect(heading).toBeInTheDocument()
})
