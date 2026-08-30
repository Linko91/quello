/** Marks the current link, since there is no router to do it. */
export function markCurrentLink() {
  const here = location.pathname.replace(/index\.html$/, '') || '/'
  for (const link of document.querySelectorAll('.site-nav a')) {
    const href = link.getAttribute('href') ?? ''
    const target = href.replace(/index\.html$/, '') || '/'
    if (target === here) link.classList.add('active')
  }
}
