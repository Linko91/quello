import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Quello } from '../src/index'

const previous = { env: process.env.NODE_ENV, options: process.env.QUELLO_OPTIONS }

beforeEach(() => {
  process.env.NODE_ENV = 'development'
  delete process.env.QUELLO_OPTIONS
})

afterEach(() => {
  process.env.NODE_ENV = previous.env
  if (previous.options === undefined) delete process.env.QUELLO_OPTIONS
  else process.env.QUELLO_OPTIONS = previous.options
})

describe('<Quello />', () => {
  it('renders a deferred script pointing at the mounted route', () => {
    const html = renderToStaticMarkup(<Quello />)
    expect(html).toContain('src="/api/quello/client.js"')
    expect(html).toContain('data-quello-endpoint="/api/quello/picks"')
    expect(html).toContain('defer')
  })

  it('carries the options as data attributes, the way every plugin does', () => {
    const html = renderToStaticMarkup(
      <Quello shortcut="ctrl+shift+p" htmlMode="full" htmlLimit={42} textLimit={7} />,
    )
    expect(html).toContain('data-quello-shortcut="ctrl+shift+p"')
    expect(html).toContain('data-quello-html-mode="full"')
    expect(html).toContain('data-quello-html-limit="42"')
    expect(html).toContain('data-quello-text-limit="7"')
  })

  it('kebab-cases theme keys', () => {
    const html = renderToStaticMarkup(
      <Quello theme={{ hoverColor: '#f0f', pickedBorderWidth: 3 }} />,
    )
    expect(html).toContain('data-quello-hover-color="#f0f"')
    expect(html).toContain('data-quello-picked-border-width="3"')
  })

  it('follows a custom basePath', () => {
    const html = renderToStaticMarkup(<Quello basePath="dev/quello" />)
    expect(html).toContain('src="/dev/quello/client.js"')
    expect(html).toContain('data-quello-endpoint="/dev/quello/picks"')
  })

  it('renders nothing in a production build', () => {
    process.env.NODE_ENV = 'production'
    expect(renderToStaticMarkup(<Quello />)).toBe('')
    expect(renderToStaticMarkup(<Quello enabled />)).toBe('')
  })

  it('renders nothing when explicitly disabled', () => {
    expect(renderToStaticMarkup(<Quello enabled={false} />)).toBe('')
  })
})
