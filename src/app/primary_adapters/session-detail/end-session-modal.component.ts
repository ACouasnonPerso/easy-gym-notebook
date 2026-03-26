import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-end-session-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="overlay" (click)="cancelled.emit()">
      <div class="form-card" (click)="$event.stopPropagation()">
        <h2 class="form-title">{{ 'session.endConfirm' | translate }}</h2>
        <div class="actions">
          <button class="btn-cancel" (click)="cancelled.emit()">{{ 'common.cancel' | translate }}</button>
          <button class="btn-primary" (click)="confirmed.emit()">{{ 'common.end' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: flex-end;
      z-index: 400;
    }
    .form-card {
      background: var(--card);
      border-radius: 20px 20px 0 0;
      padding: 24px 20px 36px;
      width: 100%;
    }
    .form-title {
      font-family: 'Syne', sans-serif;
      color: var(--text);
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 20px;
      letter-spacing: -0.3px;
    }
    .actions { display: flex; gap: 12px; }
    .btn-cancel {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--sub);
      font-size: 13px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      cursor: pointer;
    }
    .btn-primary {
      flex: 2;
      padding: 14px;
      border-radius: 12px;
      border: none;
      background: var(--orange);
      color: #000;
      font-size: 13px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      cursor: pointer;
    }
  `],
})
export class EndSessionModalComponent {
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
