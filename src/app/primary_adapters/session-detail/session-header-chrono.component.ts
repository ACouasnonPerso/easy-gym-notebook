import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { ChronoStatus } from '../../core_logic/chrono/session-chrono.service';
import { TranslateModule } from '@ngx-translate/core';
import { HapticService } from '../../core_logic/shared/haptic.service';

@Component({
  selector: 'app-session-header-chrono',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
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

  private readonly haptic = inject(HapticService);

  onEndSession(): void {
    this.haptic.vibrate();
    this.endSession.emit();
  }
}
