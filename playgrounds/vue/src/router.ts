import { createRouter, createWebHistory } from 'vue-router'
import OverviewPage from './pages/OverviewPage.vue'
import GalleryPage from './pages/GalleryPage.vue'
import ArticlePage from './pages/ArticlePage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'overview', component: OverviewPage, meta: { title: 'Overview' } },
    { path: '/gallery', name: 'gallery', component: GalleryPage, meta: { title: 'Gallery' } },
    { path: '/article', name: 'article', component: ArticlePage, meta: { title: 'Article' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// The pick's `page.title` should differ per route, so keep the document title in step.
router.afterEach((to) => {
  document.title = `${to.meta.title as string} · quello Vue playground`
})
