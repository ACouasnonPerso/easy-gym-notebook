import { Component, ChangeDetectionStrategy, input, output, inject, signal } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ExerciseOccurrence, CardioOccurrence } from "../../core_logic/shared/models";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";
import { DistanceDisplayPipe } from "../../core_logic/mass-unit/distance-display.pipe";
import { ExerciseCommentPopupComponent } from "../session-detail/exercise-comment-popup.component";

@Component({
	selector: "app-exercise-history-list",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule, DecimalPipe, WeightDisplayPipe, DistanceDisplayPipe, ExerciseCommentPopupComponent],
	templateUrl: "./exercise-history-list.component.html",
	styleUrl: "./exercise-history-list.component.scss",
})
export class ExerciseHistoryListComponent {
	readonly isCardio = input.required<boolean>();
	readonly occurrences = input.required<ExerciseOccurrence[]>();
	readonly cardioOccurrences = input.required<CardioOccurrence[]>();

	readonly activeOccurrence = signal<ExerciseOccurrence | null>(null);
	readonly showEditPopup = signal(false);

	readonly commentEdited = output<{ exerciseId: string; comment: string | null }>();

	private readonly translate = inject(TranslateService);

	openComment(occurrence: ExerciseOccurrence, event: Event): void {
		this.activeOccurrence.set(occurrence);
	}

	closeComment(): void {
		this.activeOccurrence.set(null);
	}

	openEditPopup(): void {
		this.showEditPopup.set(true);
	}

	closeEditPopup(): void {
		this.showEditPopup.set(false);
	}

	onCommentSaved(comment: string | null): void {
		this.commentEdited.emit({ exerciseId: this.activeOccurrence()!.exerciseId, comment });
		this.closeEditPopup();
		this.closeComment();
	}

	formatDate(d: Date): string {
		const locale = this.translate.currentLang === "en" ? "en-US" : "fr-FR";
		return d.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
	}
}
