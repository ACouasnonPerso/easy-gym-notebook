import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { BottomNavComponent } from './primary_adapters/shared/bottom-nav.component';
import { SessionBottomNavComponent } from './primary_adapters/shared/session-bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, SessionBottomNavComponent],
  template: `
    <router-outlet />
    @if (isSessionRoute()) {
      <app-session-bottom-nav />
    } @else {
      <app-bottom-nav />
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100dvh; background: var(--bg); }
    router-outlet + * { flex: 1; overflow-y: auto; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isSessionRoute = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/sessions/') || url.startsWith('/chrono/');
  });
}
