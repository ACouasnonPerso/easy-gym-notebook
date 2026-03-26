import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ChronoStatus } from '../../core_logic/chrono/session-chrono.service';

@Component({
  selector: 'app-session-header-chrono',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-header-chrono.component.html',
  styleUrl: './session-header-chrono.component.scss',
})
export class SessionHeaderChronoComponent {
  readonly durationLabel = input.required<string>();
  readonly chronoStatus = input.required<ChronoStatus>();
  readonly durationClick = output<void>();
  readonly endSession = output<void>();
  readonly pause = output<void>();
  readonly resume = output<void>();
}
