import { Injectable, inject } from '@angular/core';
import { ExerciseChronoService } from '../../core_logic/exercise-chrono/exercise-chrono.service';

@Injectable({ providedIn: 'root' })
export class ExerciseChronoUseCase {
  private readonly service = inject(ExerciseChronoService);

  readonly chronoState = this.service.chronoState;
  readonly mode = this.service.mode;
  readonly timeSeconds = this.service.timeSeconds;
  readonly seriesCount = this.service.seriesCount;

  initWithBreakDuration(n: number): void {
    this.service.init(n);
  }

  updateBreakDuration(n: number): void {
    this.service.updateBreakDuration(n);
  }

  start(): void {
    this.service.start();
  }

  pause(): void {
    this.service.pause();
  }

  resume(): void {
    this.service.resume();
  }

  goBreak(): void {
    this.service.goBreak();
  }

  goTraining(): void {
    this.service.goTraining();
  }

  reset(): void {
    this.service.reset();
  }
}
