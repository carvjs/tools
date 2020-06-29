import { render, screen } from '@testing-library/svelte'
import App from './app.svelte'

test('renders learn svelte link', () => {
  render(App)

  const submit = screen.getByRole('button', { name: /submit/i })

  expect(submit).toBeInTheDocument()
})
