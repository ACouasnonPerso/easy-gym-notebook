import { Injectable, inject } from "@angular/core";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

@Injectable({ providedIn: "root" })
export class MergeExercisesService {
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

	async merge(sourceNames: string[], newName: string): Promise<void> {
		if (sourceNames.length === 0) return;

		const sourceSet = new Set(sourceNames);
		const allExercises = await this.exerciseRepo.getAll();
		const toRename = allExercises.filter((e) => sourceSet.has(e.name));

		await Promise.all(toRename.map((e) => this.exerciseRepo.save({ ...e, name: newName })));
	}
}
