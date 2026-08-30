import { A } from '@solidjs/router'

export function SiteNav() {
  return (
    <nav class="site-nav">
      <span class="brand">quello</span>
      <A href="/" end activeClass="active">Overview</A>
      <A href="/gallery" activeClass="active">Gallery</A>
      <A href="/article" activeClass="active">Article</A>
      <span class="spacer" />
      <span class="hint">Alt+Q to pick</span>
    </nav>
  )
}
