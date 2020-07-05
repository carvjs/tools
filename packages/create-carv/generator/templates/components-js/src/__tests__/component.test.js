import { render, screen } from '@carv/testing-library'
import Component from '../component.svelte'

test('renders the Component', () => {
  render(Component)

  const heading = screen.getByRole('heading')

  expect(heading).toBeInTheDocument()
})
