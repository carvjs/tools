export default function loadStylesheet(href) {
  const link = document.createElement('link')

  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.href = href

  return document.head.appendChild(link)
}
