import { Component, ChangeDetectionStrategy, input, output, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";
import { ExerciseCommentPopupComponent } from "../session-detail/exercise-comment-popup.component";

@Component({
	selector: "app-exercise-history-detail-popup",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule, WeightDisplayPipe, ExerciseCommentPopupComponent],
	templateUrl: "./exercise-history-detail-popup.component.html",
	styleUrl: "./exercise-history-detail-popup.component.scss",
})
export class ExerciseHistoryDetailPopupComponent {
	readonly occurrence = input.required<ExerciseOccurrence>();
	readonly close = output<void>();
	readonly commentEdited = output<{ exerciseId: string; comment: string | null }>();

	readonly showEditPopup = signal(false);

	openEditPopup(): void {
		this.showEditPopup.set(true);
	}

	closeEditPopup(): void {
		this.showEditPopup.set(false);
	}

	onCommentSaved(comment: string | null): void {
		this.commentEdited.emit({ exerciseId: this.occurrence().exerciseId, comment });
		this.closeEditPopup();
	}
}
