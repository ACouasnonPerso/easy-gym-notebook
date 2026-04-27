import { InjectionToken } from "@angular/core";
import { ExercisePhoto } from "../../core_logic/shared/models";

export interface IExercisePhotoRepository {
	getAllPhotos(): Promise<ExercisePhoto[]>;
	getAll(exerciseName: string): Promise<ExercisePhoto[]>;
	save(photo: ExercisePhoto): Promise<void>;
	delete(exerciseName: string, capturedAt: Date): Promise<void>;
}

export const EXERCISE_PHOTO_REPOSITORY = new InjectionToken<IExercisePhotoRepository>("EXERCISE_PHOTO_REPOSITORY");
