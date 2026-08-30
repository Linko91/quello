import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import { App } from './App'
import { OverviewPage } from './pages/OverviewPage'
import { GalleryPage } from './pages/GalleryPage'
import { ArticlePage } from './pages/ArticlePage'
import './style.css'

render(
  () => (
    <Router root={App}>
      <Route path="/" component={OverviewPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/article" component={ArticlePage} />
    </Router>
  ),
  document.getElementById('root')!,
)
