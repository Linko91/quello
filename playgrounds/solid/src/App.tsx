import { createEffect } from 'solid-js'
import { useLocation } from '@solidjs/router'
import type { ParentProps } from 'solid-js'
import { SiteNav } from './components/SiteNav'

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/gallery': 'Gallery',
  '/article': 'Article',
}

export function App(props: ParentProps) {
  const location = useLocation()

  createEffect(() => {
    document.title = `${TITLES[location.pathname] ?? 'Not found'} · quello Solid playground`
    window.scrollTo(0, 0)
  })

  return (
    <>
      <SiteNav />
      {props.children}
      <footer class="site-footer">
        quello · Solid playground — three routes, all of them longer than the viewport.
      </footer>
    </>
  )
}
