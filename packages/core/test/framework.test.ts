import { afterEach, describe, expect, it } from 'vitest'
import { detectAngular, detectFramework, detectSvelte } from '../src/framework'

type NgApi = {
  getComponent?: (el: Element) => object | null
  getOwningComponent?: (el: Element) => object | null
}

function withNg(api: NgApi | undefined): void {
  if (api) (globalThis as { ng?: NgApi }).ng = api
  else delete (globalThis as { ng?: NgApi }).ng
}

function mount(html: string): Element {
  document.body.innerHTML = html
  const el = document.body.firstElementChild
  if (!el) throw new Error('fixture is empty')
  return el
}

afterEach(() => {
  withNg(undefined)
  document.body.innerHTML = ''
})

describe('detectAngular', () => {
  class _OverviewPageComponent {}

  it('is silent when the debug API is absent', () => {
    expect(detectAngular(mount('<div>x</div>'))).toBeNull()
  })

  it('names the component owning the element', () => {
    withNg({ getOwningComponent: () => new _OverviewPageComponent() })
    expect(detectAngular(mount('<button>x</button>'))).toEqual({
      framework: 'angular',
      // the compiler's leading underscore is not part of the name
      component: 'OverviewPageComponent',
    })
  })

  it('prefers the host component over the owning one', () => {
    class _CardComponent {}
    withNg({
      getComponent: () => new _CardComponent(),
      getOwningComponent: () => new _OverviewPageComponent(),
    })
    expect(detectAngular(mount('<app-card>x</app-card>'))?.component).toBe('CardComponent')
  })

  it('falls through when Angular owns nothing here', () => {
    withNg({ getComponent: () => null, getOwningComponent: () => null })
    expect(detectAngular(mount('<div>x</div>'))).toBeNull()
  })

  it('survives an API that throws on a foreign node', () => {
    withNg({
      getComponent: () => {
        throw new Error('not an Angular element')
      },
    })
    expect(detectAngular(mount('<div>x</div>'))).toBeNull()
  })
})

describe('detectFramework', () => {
  it('reports Angular when nothing earlier claims the element', () => {
    class _AppComponent {}
    withNg({ getOwningComponent: () => new _AppComponent() })
    expect(detectFramework(mount('<div>x</div>'))).toEqual({
      framework: 'angular',
      component: 'AppComponent',
    })
  })

  it('lets a more specific framework win', () => {
    class _AppComponent {}
    withNg({ getOwningComponent: () => new _AppComponent() })
    const el = mount('<div>x</div>') as Element & { __svelte_meta?: unknown }
    el.__svelte_meta = { loc: { file: 'src/App.svelte', line: 3, column: 1 } }
    expect(detectFramework(el)?.framework).toBe('svelte')
  })

  it('returns null when no framework owns the element', () => {
    expect(detectFramework(mount('<div>x</div>'))).toBeNull()
  })
})

describe('detectSvelte', () => {
  it('reads file and position from __svelte_meta', () => {
    const el = mount('<p>x</p>') as Element & { __svelte_meta?: unknown }
    el.__svelte_meta = { loc: { file: 'src/pages/Overview.svelte', line: 12, column: 4 } }
    expect(detectSvelte(el)).toEqual({
      framework: 'svelte',
      component: 'Overview',
      file: 'src/pages/Overview.svelte',
      line: 12,
      column: 4,
    })
  })

  it('walks up to the nearest annotated ancestor', () => {
    document.body.innerHTML = '<section><span>x</span></section>'
    const section = document.body.firstElementChild as Element & { __svelte_meta?: unknown }
    section.__svelte_meta = { loc: { file: 'src/App.svelte', line: 2, column: 0 } }
    expect(detectSvelte(document.querySelector('span')!)?.component).toBe('App')
  })
})
