import type { Routes } from '@angular/router'
import { OverviewPageComponent } from './pages/overview-page.component'
import { GalleryPageComponent } from './pages/gallery-page.component'
import { ArticlePageComponent } from './pages/article-page.component'

export const routes: Routes = [
  { path: '', component: OverviewPageComponent, title: 'Overview · quello Angular playground' },
  { path: 'gallery', component: GalleryPageComponent, title: 'Gallery · quello Angular playground' },
  { path: 'article', component: ArticlePageComponent, title: 'Article · quello Angular playground' },
]
