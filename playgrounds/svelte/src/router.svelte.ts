/** A minimal history router, so the playground has real routes without a framework. */
const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/gallery': 'Gallery',
  '/article': 'Article',
}

class Router {
  path = $state(location.pathname)

  constructor() {
    window.addEventListener('popstate', () => this.sync())
    this.title()
  }

  go(to: string): void {
    if (to === location.pathname) return
    history.pushState({}, '', to)
    this.sync()
    window.scrollTo(0, 0)
  }

  private sync(): void {
    this.path = location.pathname
    this.title()
  }

  private title(): void {
    document.title = `${TITLES[this.path] ?? 'Not found'} · quello Svelte playground`
  }
}

export const router = new Router()
