import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../core_logic/session/session.service';
import { SessionChronoService } from '../../core_logic/chrono/session-chrono.service';

@Injectable({ providedIn: 'root' })
export class EndSessionUseCase {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly sessionChronoService = inject(SessionChronoService);

  readonly showManualOverride = signal<boolean>(false);

  execute(): void {
    const elapsed = this.sessionChronoService.stop();
    if (elapsed > 0) {
      this.sessionService.updateCurrentSession({ durationSeconds: elapsed, status: 'completed' });
      this.router.navigate(['/sessions']);
    } else {
      this.showManualOverride.set(true);
    }
  }

  executeWithManualDuration(seconds: number): void {
    this.sessionChronoService.stop();
    this.sessionService.updateCurrentSession({ durationSeconds: seconds, status: 'completed' });
    this.router.navigate(['/sessions']);
  }
}
