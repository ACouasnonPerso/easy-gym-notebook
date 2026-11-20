import { Component, ChangeDetectionStrategy, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { RATING_OPTIONS, RatingOption, ratingDisplayValue } from "../../core_logic/shared/rating-options";

@Component({
	selector: "app-exercise-rating-popup",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./exercise-rating-popup.component.html",
	styleUrl: "./exercise-rating-popup.component.scss",
})
export class ExerciseRatingPopupComponent {
	readonly currentRating = input<number | null>(null);
	readonly ratingSelected = output<number | null>();
	readonly cancelled = output<void>();

	readonly options = RATING_OPTIONS;

	selectRating(value: number): void {
		if (this.currentRating() === value) {
			this.ratingSelected.emit(null);
		} else {
			this.ratingSelected.emit(value);
		}
	}

	displayValue(option: RatingOption): string {
		return ratingDisplayValue(option);
	}
}
