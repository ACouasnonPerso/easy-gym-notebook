import { Component, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-import-confirm-modal",
	standalone: true,
	imports: [TranslateModule],
	templateUrl: "./import-confirm-modal.component.html",
	styleUrl: "./stats-global.component.scss",
})
export class ImportConfirmModalComponent {
	readonly sessionCount = input.required<number>();
	readonly exerciseCount = input.required<number>();
	readonly confirmed = output<void>();
	readonly cancelled = output<void>();

	onConfirm(): void {
		this.confirmed.emit();
	}

	onCancel(): void {
		this.cancelled.emit();
	}
}
