import { Injectable, inject } from '@angular/core';
import { ExerciseService } from '../../core_logic/session-detail/exercise.service';
import { MuscleGroupDetectorService } from '../../core_logic/shared/muscle-group-detector.service';
import { SessionService } from '../../core_logic/session/session.service';

interface AddExerciseParams {
  name: string;
  weightKg: number;
  sets: number;
  reps: number;
  breakDurationSeconds: number;
  sessionId: string;
}

@Injectable({ providedIn: 'root' })
export class AddExerciseUseCase {
  private readonly exerciseService = inject(ExerciseService);
  private readonly muscleDetector = inject(MuscleGroupDetectorService);
  private readonly sessionService = inject(SessionService);

  async execute(params: AddExerciseParams): Promise<void> {
    const { muscleGroups } = this.muscleDetector.detect(params.name);
    const muscleGroup = muscleGroups[0] ?? null;

    const rawName = params.name.slice(0, 60);
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const exercise = {
      id: crypto.randomUUID(),
      sessionId: params.sessionId,
      name: formattedName,
      muscleGroup,
      muscleGroups,
      weightKg: params.weightKg,
      sets: params.sets,
      reps: params.reps,
      breakDurationSeconds: params.breakDurationSeconds,
      status: 'pending' as const,
    };

    await this.exerciseService.add(exercise);

    const session = this.sessionService.currentSession();
    if (muscleGroup !== null && session && !session.muscleGroup)
      await this.sessionService.updateCurrentSession({ muscleGroup });
  }
}
