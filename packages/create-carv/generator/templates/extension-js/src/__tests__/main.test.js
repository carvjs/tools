import { render, screen } from '@carv/testing-library'
import Extension from '../main.svelte'

test('renders the extension', () => {
  render(Extension)

  const heading = screen.getByRole('heading')

  expect(heading).toBeInTheDocument()
})
