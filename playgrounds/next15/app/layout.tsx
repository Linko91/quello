import type { ReactNode } from 'react'
import Link from 'next/link'
import { Quello } from '@quello/next'
import './style.css'

export const metadata = { title: 'quello · Next playground' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="site-nav">
          <span className="brand">quello</span>
          <Link href="/">Overview</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/article">Article</Link>
          <span className="spacer" />
          <span className="hint">Alt+Q to pick</span>
        </nav>
        {children}
        <footer className="site-footer">
          quello · Next playground — three routes, all of them longer than the viewport.
        </footer>
        <Quello />
      </body>
    </html>
  )
}
