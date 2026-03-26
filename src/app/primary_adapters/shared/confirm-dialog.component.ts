import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="overlay" (click)="cancelled.emit()">
      <div class="card" (click)="$event.stopPropagation()">
        <p class="message">{{ message() }}</p>
        <div class="actions">
          <button class="btn btn-cancel" (click)="cancelled.emit()">{{ 'common.cancel' | translate }}</button>
          <button class="btn btn-confirm" (click)="confirmed.emit()">{{ 'common.confirm' | translate }}</button>
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
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      max-width: 320px;
      width: 90%;
    }
    .message {
      color: #1a1a2e;
      font-size: 16px;
      margin: 0 0 20px;
      text-align: center;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-cancel {
      background: #e0e0e0;
      color: #333;
    }
    .btn-confirm {
      background: #f5a623;
      color: #fff;
    }
  `],
})
export class ConfirmDialogComponent {
  readonly message = input<string>('');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
