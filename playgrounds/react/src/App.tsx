import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteNav } from './components/SiteNav'
import { OverviewPage } from './pages/OverviewPage'
import { GalleryPage } from './pages/GalleryPage'
import { ArticlePage } from './pages/ArticlePage'

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/gallery': 'Gallery',
  '/article': 'Article',
}

export function App() {
  const { pathname } = useLocation()

  // The pick's `page.title` should differ per route, so keep the document title in step.
  useEffect(() => {
    document.title = `${TITLES[pathname] ?? 'Not found'} · quello React playground`
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <SiteNav />
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/article" element={<ArticlePage />} />
      </Routes>
      <footer className="site-footer">
        quello · React playground — three routes, all of them longer than the viewport.
      </footer>
    </>
  )
}
