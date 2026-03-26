import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Session } from '../../core_logic/shared/models';
import { ChronoStatus } from '../../core_logic/chrono/session-chrono.service';
import { SessionHeaderStatsComponent } from './session-header-stats.component';
import { SessionHeaderChronoComponent } from './session-header-chrono.component';

@Component({
  selector: 'app-session-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionHeaderStatsComponent, SessionHeaderChronoComponent],
  templateUrl: './session-header.component.html',
  styleUrl: './session-header.component.scss',
})
export class SessionHeaderComponent {
  readonly session = input.required<Session>();
  readonly durationLabel = input.required<string>();
  readonly chronoStatus = input.required<ChronoStatus>();
  readonly totalWeightFormatted = input.required<string>();

  readonly goBack = output<void>();
  readonly dateChange = output<string>();
  readonly durationClick = output<void>();
  readonly endSession = output<void>();
  readonly pause = output<void>();
  readonly resume = output<void>();
}
