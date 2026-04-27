import { Injectable, signal } from "@angular/core";
import { ExercisePhoto } from "../core_logic/shared/models";

@Injectable({ providedIn: "root" })
export class ExercisePhotoStore {
	private readonly _photos = signal<ExercisePhoto[]>([]);
	readonly photos = this._photos.asReadonly();

	getByName(name: string): ExercisePhoto | undefined {
		return this._photos().find((p) => p.exerciseName === name);
	}

	setAll(photos: ExercisePhoto[]): void {
		this._photos.set(photos);
	}

	setForName(name: string, photo: ExercisePhoto): void {
		this._photos.update((photos) => {
			const existing = photos.findIndex((p) => p.exerciseName === name);
			if (existing >= 0) {
				const updated = [...photos];
				updated[existing] = photo;
				return updated;
			}
			return [...photos, photo];
		});
	}

	clearForName(name: string): void {
		this._photos.update((photos) => photos.filter((p) => p.exerciseName !== name));
	}
}
