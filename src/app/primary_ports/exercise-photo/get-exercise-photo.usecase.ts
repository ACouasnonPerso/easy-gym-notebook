import { Injectable, inject } from "@angular/core";
import { ExercisePhotoStore } from "../../stores/exercise-photo.store";

@Injectable({ providedIn: "root" })
export class GetExercisePhotoUseCase {
	private readonly store = inject(ExercisePhotoStore);

	photoFor(name: string): string | undefined {
		return this.store.getByName(name)?.dataUrl;
	}
}
