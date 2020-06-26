import { render } from '@testing-library/svelte'
import App from './app'

test('renders learn svelte link', () => {
  const { getByRole } = render(App)
  const submit = getByRole('button', { name: /submit/i })
  expect(submit).toBeInTheDocument()
})
