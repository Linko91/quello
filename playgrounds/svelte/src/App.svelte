<script lang="ts">
  import SiteNav from './components/SiteNav.svelte'
  import OverviewPage from './pages/OverviewPage.svelte'
  import GalleryPage from './pages/GalleryPage.svelte'
  import ArticlePage from './pages/ArticlePage.svelte'
  import { router } from './router.svelte'
</script>

<SiteNav />
{#if router.path === '/gallery'}
  <GalleryPage />
{:else if router.path === '/article'}
  <ArticlePage />
{:else}
  <OverviewPage />
{/if}
<footer class="site-footer">
  quello · Svelte playground — three routes, all of them longer than the viewport.
</footer>
