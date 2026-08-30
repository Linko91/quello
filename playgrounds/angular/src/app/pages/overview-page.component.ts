import { Component } from '@angular/core'
import { features, sections } from '../content'

@Component({
  selector: 'app-overview-page',
  standalone: true,
  template: `
    <main class="page">
      <header class="hero">
        <h1>Point at it, then say "quello"</h1>
        <p class="lead">
          Angular's dev server is not Vite-configurable, so quello runs beside it from the CLI and
          this page points at that origin.
        </p>
        <div class="badge-row">
          <span class="pill">Angular 19</span>
          <span class="pill">quello CLI</span>
          <span class="pill">3 routes</span>
          <span class="pill">sticky nav + rail</span>
        </div>
        <div class="actions">
          <button class="cta" (click)="clicks = clicks + 1">Clicked {{ clicks }} times</button>
          <button class="ghost">Secondary action</button>
        </div>
      </header>

      <h2>What a pick carries</h2>
      <section class="grid">
        @for (feature of features; track feature.title) {
          <article class="card">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.body }}</p>
            <span class="tag">{{ feature.tag }}</span>
          </article>
        }
      </section>

      <div class="split" style="margin-top: 48px">
        <aside class="rail">
          @for (section of sections; track section.id) {
            <a href="#{{ section.id }}">{{ section.title }}</a>
          }
        </aside>
        <div>
          @for (section of sections; track section.id) {
            <section id="{{ section.id }}">
              <h2 style="margin-top: 0">{{ section.title }}</h2>
              @for (paragraph of section.paragraphs; track $index) { <p>{{ paragraph }}</p> }
            </section>
          }
        </div>
      </div>
    </main>
  `,
})
export class OverviewPageComponent {
  readonly features = features
  readonly sections = sections
  clicks = 0
}
