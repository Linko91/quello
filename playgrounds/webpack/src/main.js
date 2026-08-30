import './style.css'
import { changelog, features, sections, tiles } from './content'

/** A hand-rolled router, so webpack's playground has the same three routes. */
const routes = {
  '/': overview,
  '/gallery': gallery,
  '/article': article,
}

const TITLES = { '/': 'Overview', '/gallery': 'Gallery', '/article': 'Article' }

function nav(path) {
  const link = (to, label) =>
    `<a href="${to}" class="${to === path ? 'active' : ''}" data-link>${label}</a>`
  return `<nav class="site-nav">
    <span class="brand">quello</span>
    ${link('/', 'Overview')}${link('/gallery', 'Gallery')}${link('/article', 'Article')}
    <span class="spacer"></span><span class="hint">Alt+Q to pick</span>
  </nav>`
}

function overview() {
  return `<main class="page">
    <header class="hero">
      <h1>Point at it, then say "quello"</h1>
      <p class="lead">Built with webpack and html-webpack-plugin, which is where the script tag comes from.</p>
      <div class="badge-row">
        <span class="pill">webpack 5</span><span class="pill">dev-server</span>
        <span class="pill">3 routes</span><span class="pill">sticky nav + rail</span>
      </div>
      <div class="actions">
        <button class="cta" id="counter">Clicked 0 times</button>
        <button class="ghost">Secondary action</button>
      </div>
    </header>
    <h2>What a pick carries</h2>
    <section class="grid">
      ${features.map((f) => `<article class="card"><h3>${f.title}</h3><p>${f.body}</p><span class="tag">${f.tag}</span></article>`).join('')}
    </section>
    <div class="split" style="margin-top:48px">
      <aside class="rail">${sections.map((s) => `<a href="#${s.id}">${s.title}</a>`).join('')}</aside>
      <div>${sections.map((s) => `<section id="${s.id}"><h2 style="margin-top:0">${s.title}</h2>${s.paragraphs.map((p) => `<p>${p}</p>`).join('')}</section>`).join('')}</div>
    </div>
  </main>`
}

function gallery() {
  return `<main class="page">
    <header class="hero"><h1>Gallery</h1>
      <p class="lead">${tiles.length} near-identical tiles, told apart only by position.</p>
    </header>
    <section class="grid">
      ${tiles.map((t) => `<article class="tile"><div class="swatch" style="background: hsl(${t.hue} 55% 42%)"></div><div class="body"><h3>${t.name}</h3><p>${t.group}</p></div></article>`).join('')}
    </section>
  </main>`
}

function article() {
  return `<main class="page">
    <header class="hero"><h1>A long page, on purpose</h1>
      <p class="lead">Scroll past all of this with a pick made at the top.</p>
    </header>
    ${sections.map((s) => `<section id="a-${s.id}"><h2>${s.title}</h2>${s.paragraphs.map((p) => `<p>${p}</p>`).join('')}</section>`).join('')}
    <h2>Changelog</h2>
    <table><thead><tr><th>Version</th><th>Date</th><th>Note</th></tr></thead>
      <tbody>${changelog.map((e) => `<tr><td>${e.version}</td><td>${e.date}</td><td>${e.note}</td></tr>`).join('')}</tbody>
    </table>
    <h2>Report something</h2>
    <form class="form" onsubmit="return false">
      <div class="field"><label for="email">Email</label><input id="email" type="email" placeholder="you@example.com" /></div>
      <div class="field"><label for="topic">Topic</label><select id="topic"><option>Bug</option><option>Idea</option></select></div>
      <div class="actions" style="margin-top:0"><button class="cta" type="button">Send</button></div>
    </form>
  </main>`
}

function render() {
  const path = location.pathname
  const page = routes[path] ?? overview
  document.title = `${TITLES[path] ?? 'Overview'} · quello webpack playground`
  document.getElementById('app').innerHTML = `${nav(path)}${page()}<footer class="site-footer">quello · webpack playground</footer>`

  const counter = document.getElementById('counter')
  if (counter) {
    let clicks = 0
    counter.addEventListener('click', () => {
      clicks++
      counter.textContent = `Clicked ${clicks} times`
    })
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-link]')
  if (!link) return
  event.preventDefault()
  history.pushState({}, '', link.getAttribute('href'))
  render()
  window.scrollTo(0, 0)
})
window.addEventListener('popstate', render)
render()
