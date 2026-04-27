import { Injectable, inject } from "@angular/core";
import { ExercisePhotoService } from "../../core_logic/exercise-photo/exercise-photo.service";

@Injectable({ providedIn: "root" })
export class SetExercisePhotoUseCase {
	private readonly service = inject(ExercisePhotoService);

	async execute(name: string, file: File): Promise<void> {
		if (!file.type.startsWith("image/")) {
			return;
		}
		await this.service.setForName(name, file);
	}
}
