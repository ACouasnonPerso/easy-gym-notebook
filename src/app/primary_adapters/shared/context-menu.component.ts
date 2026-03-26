import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <div class="menu">
      @for (option of options(); track option) {
        <button class="menu-item" (click)="selected.emit(option); closed.emit()">
          {{ option }}
        </button>
      }
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 900;
    }
    .menu {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #16213e;
      border-radius: 12px;
      overflow: hidden;
      z-index: 901;
      min-width: 200px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    .menu-item {
      display: block;
      width: 100%;
      padding: 16px 24px;
      background: none;
      border: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 16px;
      text-align: left;
      cursor: pointer;
    }
    .menu-item:last-child {
      border-bottom: none;
    }
    .menu-item:hover {
      background: rgba(245, 166, 35, 0.15);
    }
  `],
})
export class ContextMenuComponent {
  readonly options = input<string[]>([]);
  readonly selected = output<string>();
  readonly closed = output<void>();
}
