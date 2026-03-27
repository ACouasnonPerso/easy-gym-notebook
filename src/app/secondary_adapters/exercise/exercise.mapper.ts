import { Injectable } from '@angular/core';
import { Exercise, RawExercise } from '../../core_logic/shared/models';

@Injectable()
export class ExerciseMapper {
  toDomain(raw: RawExercise): Exercise {
    return {
      id: raw.id,
      sessionId: raw.sessionId,
      name: raw.name,
      muscleGroup: raw.muscleGroup,
      muscleGroups: raw.muscleGroup ? [raw.muscleGroup] : [],
      weightKg: raw.weightKg,
      sets: raw.sets,
      reps: raw.reps,
      breakDurationSeconds: raw.breakDurationSeconds,
      status: raw.status,
      isCardio: raw.isCardio ?? false,
      durationSeconds: raw.durationSeconds ?? 0,
      distanceKm: raw.distanceKm ?? null,
      isPyramid: raw.isPyramid ?? false,
      pyramidSets: raw.pyramidSets ?? [],
    };
  }

  toStorage(exercise: Exercise): RawExercise {
    return {
      id: exercise.id,
      sessionId: exercise.sessionId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      weightKg: exercise.weightKg,
      sets: exercise.sets,
      reps: exercise.reps,
      breakDurationSeconds: exercise.breakDurationSeconds,
      status: exercise.status,
      isCardio: exercise.isCardio,
      durationSeconds: exercise.durationSeconds,
      distanceKm: exercise.distanceKm,
      isPyramid: exercise.isPyramid,
      pyramidSets: exercise.pyramidSets,
    };
  }
}
