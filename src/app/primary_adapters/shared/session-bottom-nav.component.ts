import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionDetailUiService } from '../session-detail/session-detail-ui.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-session-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <nav [attr.aria-label]="'nav.sessionNavigation' | translate">
      <div class="nav-bar">
        <div class="nav-inner">
          <a [routerLink]="sessionLink()" routerLinkActive="active" class="nav-link">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span class="nav-label">{{ 'nav.session' | translate }}</span>
          </a>
          <div class="center-slot">
            <button class="center-btn" (click)="openAddExercise()" [attr.aria-label]="'nav.addExercise' | translate">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          <a routerLink="/chrono/exercise" routerLinkActive="active" class="nav-link">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/>
              <polyline points="12 7 12 12 15 15"/>
              <line x1="9" y1="1" x2="15" y2="1"/>
            </svg>
            <span class="nav-label">{{ 'nav.chrono' | translate }}</span>
          </a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
    }

    .nav-bar {
      background: var(--card);
      border-top: 1.5px solid var(--border);
    }

    .nav-inner {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 32px 16px;
      max-width: 720px;
      margin: 0 auto;
      width: 100%;
    }

    .nav-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: var(--muted);
      text-decoration: none;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.3px;
      transition: color 0.15s;
      min-width: 56px;
    }

    .nav-link:hover { color: var(--text); }
    .nav-link.active { color: var(--blue); }

    .nav-label {
      line-height: 1;
    }

    .center-slot {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 64px;
      margin-top: -36px;
    }

    .center-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: var(--blue);
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow:
        0 0 0 4px var(--card),
        0 0 0 5.5px var(--border),
        0 8px 24px rgba(59, 130, 246, 0.35);
      transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    }

    .center-btn:hover {
      background: #60a5fa;
      transform: translateY(-2px);
      box-shadow:
        0 0 0 4px var(--card),
        0 0 0 5.5px var(--border),
        0 12px 32px rgba(59, 130, 246, 0.45);
    }

    .center-btn:active {
      transform: translateY(0);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionBottomNavComponent {
  private readonly uiService = inject(SessionDetailUiService);

  readonly sessionLink = computed(() => {
    const id = this.uiService.currentSessionId();
    return id ? `/sessions/${id}` : '/sessions';
  });

  openAddExercise(): void {
    this.uiService.openAddExerciseForm();
  }
}
