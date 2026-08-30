import { Component } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="site-nav">
      <span class="brand">quello</span>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Overview</a>
      <a routerLink="/gallery" routerLinkActive="active">Gallery</a>
      <a routerLink="/article" routerLinkActive="active">Article</a>
      <span class="spacer"></span>
      <span class="hint">Alt+Q to pick</span>
    </nav>
    <router-outlet />
    <footer class="site-footer">
      quello · Angular playground — three routes, all of them longer than the viewport.
    </footer>
  `,
})
export class AppComponent {}
