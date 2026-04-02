import { Component, ChangeDetectionStrategy, input, output, signal, effect } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-exercise-comment-popup",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./exercise-comment-popup.component.html",
	styleUrl: "./exercise-comment-popup.component.scss",
})
export class ExerciseCommentPopupComponent {
	readonly currentComment = input<string | null>(null);
	readonly commentSaved = output<string | null>();
	readonly cancelled = output<void>();

	readonly textValue = signal<string>("");

	constructor() {
		effect(() => {
			this.textValue.set(this.currentComment() ?? "");
		});
	}

	onInput(event: Event): void {
		this.textValue.set((event.target as HTMLTextAreaElement).value);
	}

	save(): void {
		const val = this.textValue().trim();
		this.commentSaved.emit(val.length > 0 ? val : null);
	}
}
