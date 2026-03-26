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
  isCardio?: boolean;
  durationSeconds?: number;
  distanceKm?: number | null;
}

@Injectable({ providedIn: 'root' })
export class AddExerciseUseCase {
  private readonly exerciseService = inject(ExerciseService);
  private readonly muscleDetector = inject(MuscleGroupDetectorService);
  private readonly sessionService = inject(SessionService);

  async execute(params: AddExerciseParams): Promise<void> {
    const isCardio = params.isCardio ?? false;
    const { muscleGroups } = this.muscleDetector.detect(params.name);
    const muscleGroup = isCardio ? null : (muscleGroups[0] ?? null);
    const resolvedMuscleGroups = isCardio ? [] : muscleGroups;

    const rawName = params.name.slice(0, 60);
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const exercise = {
      id: crypto.randomUUID(),
      sessionId: params.sessionId,
      name: formattedName,
      muscleGroup,
      muscleGroups: resolvedMuscleGroups,
      weightKg: isCardio ? 0 : params.weightKg,
      sets: isCardio ? 0 : params.sets,
      reps: isCardio ? 0 : params.reps,
      breakDurationSeconds: isCardio ? 0 : params.breakDurationSeconds,
      status: 'pending' as const,
      isCardio,
      durationSeconds: params.durationSeconds ?? 0,
      distanceKm: params.distanceKm ?? null,
    };

    await this.exerciseService.add(exercise);

    const session = this.sessionService.currentSession();
    if (!isCardio && muscleGroup !== null && session && !session.muscleGroup)
      await this.sessionService.updateCurrentSession({ muscleGroup });
  }
}
