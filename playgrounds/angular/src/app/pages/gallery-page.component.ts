import { Component } from '@angular/core'
import { groups, tiles } from '../content'

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  template: `
    <main class="page">
      <header class="hero">
        <h1>Gallery</h1>
        <p class="lead">
          {{ tiles.length }} near-identical tiles. They share a tag and a class, so a selector has
          to fall back on position to tell one from another.
        </p>
      </header>

      <div class="filters">
        @for (group of groups; track group) {
          <button [class.on]="active === group" (click)="active = group">{{ group }}</button>
        }
      </div>

      <section class="grid">
        @for (tile of shown; track tile.id) {
          <article class="tile">
            <div class="swatch" [style.background]="'hsl(' + tile.hue + ' 55% 42%)'"></div>
            <div class="body"><h3>{{ tile.name }}</h3><p>{{ tile.group }}</p></div>
          </article>
        }
      </section>

      <h2>Why this page exists</h2>
      <p>Filtering removes tiles from the DOM, so a pick can lose the element it points at.</p>
    </main>
  `,
})
export class GalleryPageComponent {
  readonly tiles = tiles
  readonly groups = groups
  active: (typeof groups)[number] = 'all'

  get shown() {
    return this.active === 'all' ? tiles : tiles.filter((t) => t.group === this.active)
  }
}
