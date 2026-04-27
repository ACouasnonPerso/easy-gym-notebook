import { Component, ChangeDetectionStrategy, input, output, computed, inject } from "@angular/core";
import { GetExercisePhotoUseCase } from "../../primary_ports/exercise-photo/get-exercise-photo.usecase";

@Component({
	selector: "app-photo-thumbnail",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (photoUrl()) {
			<img
				[src]="photoUrl()"
				class="photo-thumbnail"
				alt=""
				(click)="$event.stopPropagation(); clickPhoto.emit(photoUrl()!)"
			/>
		}
	`,
	styles: [`
		:host {
			display: contents;
		}
		.photo-thumbnail {
			width: 48px;
			height: 48px;
			object-fit: cover;
			border-radius: 6px;
			cursor: pointer;
			flex-shrink: 0;
		}
	`],
})
export class PhotoThumbnailComponent {
	private readonly getPhoto = inject(GetExercisePhotoUseCase);

	readonly exerciseName = input.required<string>();
	readonly clickPhoto = output<string>();

	readonly photoUrl = computed(() => this.getPhoto.photoFor(this.exerciseName()));
}
