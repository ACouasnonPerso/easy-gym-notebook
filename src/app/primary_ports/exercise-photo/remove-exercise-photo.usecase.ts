import { Injectable, inject } from "@angular/core";
import { ExercisePhotoService } from "../../core_logic/exercise-photo/exercise-photo.service";

@Injectable({ providedIn: "root" })
export class RemoveExercisePhotoUseCase {
	private readonly service = inject(ExercisePhotoService);

	async execute(name: string): Promise<void> {
		await this.service.removeForName(name);
	}
}
