import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { BottomNavComponent } from './primary_adapters/shared/bottom-nav.component';
import { SessionBottomNavComponent } from './primary_adapters/shared/session-bottom-nav.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, SessionBottomNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');
    const browserLang = this.translate.getBrowserLang();
    const lang = browserLang === 'en' ? 'en' : 'fr';
    this.translate.use(lang);
  }

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
