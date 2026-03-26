import { Injectable, inject } from '@angular/core';
import { SessionService } from '../../core_logic/session/session.service';
import { ExerciseService } from '../../core_logic/session-detail/exercise.service';

@Injectable({ providedIn: 'root' })
export class GetSessionDetailUseCase {
  private readonly sessionService = inject(SessionService);
  private readonly exerciseService = inject(ExerciseService);

  readonly session = this.sessionService.currentSession;
  readonly exercises = this.exerciseService.exercises;

  execute(id: string): void {
    this.sessionService.loadById(id);
    this.exerciseService.loadBySession(id);
  }
}
