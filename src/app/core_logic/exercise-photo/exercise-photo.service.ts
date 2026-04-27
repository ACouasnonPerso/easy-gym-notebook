import { Injectable, inject } from "@angular/core";
import { ExercisePhotoStore } from "../../stores/exercise-photo.store";
import { EXERCISE_PHOTO_REPOSITORY } from "../../secondary_ports/exercise-photo/exercise-photo.repository.interface";
import { ImageDownscalerService } from "./image-downscaler.service";

@Injectable()
export class ExercisePhotoService {
	private readonly store = inject(ExercisePhotoStore);
	private readonly repo = inject(EXERCISE_PHOTO_REPOSITORY);
	private readonly downscaler = inject(ImageDownscalerService);

	async loadAll(): Promise<void> {
		const photos = await this.repo.getAllPhotos();
		this.store.setAll(photos);
	}

	async setForName(name: string, file: File): Promise<void> {
		const dataUrl = await this.downscaler.downscale(file, 1024);
		const photo = { exerciseName: name, dataUrl, capturedAt: new Date() };
		await this.repo.save(photo);
		this.store.setForName(name, photo);
	}

	async removeForName(name: string): Promise<void> {
		const photo = this.store.getByName(name);
		if (photo) {
			await this.repo.delete(name, photo.capturedAt);
		}
		this.store.clearForName(name);
	}
}
