import { describe, expect, it } from 'vitest'
import { detectReact } from '../src/framework'

interface Fiber {
  type?: unknown
  return?: Fiber | null
  _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number }
  _debugStack?: Error
}

/** Attach a fiber the way react-dom does, under a randomised key. */
function mount(html: string, fiber: Fiber): Element {
  document.body.innerHTML = html
  const el = document.body.firstElementChild
  if (!el) throw new Error('fixture is empty')
  ;(el as unknown as Record<string, Fiber>)['__reactFiber$abc123'] = fiber
  return el
}

/** An owner stack: the message line, the `jsx` frame, then the owner's frame. */
function stack(...frames: string[]): Error {
  const error = new Error('react-stack-top-frame')
  error.stack = ['Error: react-stack-top-frame', ...frames].join('\n')
  return error
}

const JSX_FRAME =
  '    at exports.jsxDEV (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js:321:13)'
const RENDER_FRAMES = [
  '    at renderWithHooks (webpack-internal:///(app-pages-browser)/../../node_modules/react-dom/cjs/react-dom-client.development.js:6805:22)',
  '    at performWorkOnRoot (/injected.js:7:48553)',
]

/** `displayName` rather than a named function: the bundler rewrites those. */
const OverviewPage = Object.assign(() => null, { displayName: 'OverviewPage' })

describe('detectReact', () => {
  it('reads _debugSource, as React 18 and earlier leave it', () => {
    const host: Fiber = {
      type: 'h1',
      return: { type: OverviewPage, return: null },
      _debugSource: { fileName: '/src/App.tsx', lineNumber: 12, columnNumber: 3 },
    }

    expect(detectReact(mount('<h1>hi</h1>', host))).toEqual({
      framework: 'react',
      component: 'OverviewPage',
      file: '/src/App.tsx',
      line: 12,
      column: 3,
    })
  })

  describe('owner stacks, which replaced _debugSource in React 19', () => {
    it('takes the file from the frame that owns the element', () => {
      const host: Fiber = {
        type: 'h1',
        return: { type: OverviewPage, return: null },
        _debugStack: stack(
          JSX_FRAME,
          '    at OverviewPage (webpack-internal:///(app-pages-browser)/./app/page.tsx:22:96)',
          ...RENDER_FRAMES,
        ),
      }

      expect(detectReact(mount('<h1>hi</h1>', host))).toEqual({
        framework: 'react',
        component: 'OverviewPage',
        file: 'app/page.tsx',
      })
    })

    it('reports no line, because a stack frame addresses the compiled module', () => {
      const host: Fiber = {
        type: 'h1',
        return: { type: OverviewPage, return: null },
        _debugStack: stack(JSX_FRAME, '    at App (webpack-internal:///./app/page.tsx:22:96)'),
      }

      const info = detectReact(mount('<h1>hi</h1>', host))
      expect(info).toHaveProperty('file')
      expect(info).not.toHaveProperty('line')
      expect(info).not.toHaveProperty('column')
    })

    it('unwraps a Server Component’s frame, schemes nested and all', () => {
      const host: Fiber = {
        type: 'footer',
        return: { type: OverviewPage, return: null },
        _debugStack: stack(
          '    at fakeJSXCallSite (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-client.browser.development.js:2603:14)',
          '    at RootLayout (about://React/Server/webpack-internal:///(rsc)/./app/layout.tsx?8:81:92)',
        ),
      }

      expect(detectReact(mount('<footer>x</footer>', host))).toMatchObject({
        file: 'app/layout.tsx',
      })
    })

    it('reduces a dev-server URL to its path, query string and all', () => {
      const host: Fiber = {
        type: 'h1',
        return: { type: OverviewPage, return: null },
        _debugStack: stack(
          '    at jsxDEV (/node_modules/.vite/deps/react_jsx-dev-runtime.js:20:1)',
          '    at App (http://localhost:5173/src/App.tsx?t=1730000000:12:3)',
        ),
      }

      expect(detectReact(mount('<h1>hi</h1>', host))).toMatchObject({ file: '/src/App.tsx' })
    })

    it('says nothing when the element was written inside a dependency', () => {
      const host: Fiber = {
        type: 'a',
        return: { type: OverviewPage, return: null },
        _debugStack: stack(
          JSX_FRAME,
          '    at LinkComponent (webpack-internal:///./node_modules/next/dist/client/app-dir/link.js:366:50)',
          ...RENDER_FRAMES,
        ),
      }

      expect(detectReact(mount('<a href="/">go</a>', host))).toEqual({
        framework: 'react',
        component: 'OverviewPage',
      })
    })

    it('ignores an ancestor’s stack, which describes the ancestor and not this element', () => {
      const component: Fiber = {
        type: OverviewPage,
        return: null,
        _debugStack: stack(JSX_FRAME, '    at Root (/src/somewhere-else.tsx:400:1)'),
      }
      const host: Fiber = { type: 'a', return: component }

      expect(detectReact(mount('<a href="/">go</a>', host))).toEqual({
        framework: 'react',
        component: 'OverviewPage',
      })
    })

    it('prefers _debugSource when a React version offers both', () => {
      const host: Fiber = {
        type: 'h1',
        return: { type: OverviewPage, return: null },
        _debugSource: { fileName: '/src/Real.tsx', lineNumber: 1, columnNumber: 1 },
        _debugStack: stack(JSX_FRAME, '    at App (/src/FromStack.tsx:99:1)'),
      }

      expect(detectReact(mount('<h1>hi</h1>', host))).toMatchObject({
        file: '/src/Real.tsx',
        line: 1,
      })
    })

    it('survives a fiber whose stack was never captured', () => {
      const host: Fiber = { type: 'h1', return: { type: OverviewPage, return: null } }
      expect(detectReact(mount('<h1>hi</h1>', host))).toEqual({
        framework: 'react',
        component: 'OverviewPage',
      })
    })
  })

  it('is silent on an element React does not own', () => {
    document.body.innerHTML = '<h1>hi</h1>'
    expect(detectReact(document.body.firstElementChild as Element)).toBeNull()
  })
})
