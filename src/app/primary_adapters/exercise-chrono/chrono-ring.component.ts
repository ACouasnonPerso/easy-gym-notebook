import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-chrono-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chrono-ring-wrap">
      <svg class="chrono-ring-svg" width="200" height="200" viewBox="0 0 200 200">
        <circle class="chrono-ring-track" cx="100" cy="100" r="90"/>
        <circle class="chrono-ring-fill" cx="100" cy="100" r="90"
          [attr.stroke]="ringColor()"
          [attr.stroke-dashoffset]="ringOffset()"/>
      </svg>
      <div class="chrono-inner">
        <div class="chrono-time">{{ formattedTime() }}</div>
        <div class="chrono-label" [style.color]="ringColor()">{{ statusLabel() }}</div>
      </div>
    </div>
  `,
})
export class ChronoRingComponent {
  readonly formattedTime = input.required<string>();
  readonly statusLabel = input.required<string>();
  readonly ringColor = input.required<string>();
  readonly ringOffset = input.required<number>();
}
