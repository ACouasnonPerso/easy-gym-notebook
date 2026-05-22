import { Component, ChangeDetectionStrategy, inject, signal, computed, output } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

@Component({
	selector: "app-delete-all-modal",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./delete-all-modal.component.html",
	styleUrl: "./delete-all-modal.component.scss",
})
export class DeleteAllModalComponent {
	private readonly translate = inject(TranslateService);

	readonly confirmed = output<void>();
	readonly cancelled = output<void>();

	readonly typedValue = signal<string>("");

	readonly isMatch = computed(() => {
		const typed = this.typedValue().trim().toLowerCase();
		const expected = this.translate.instant("deleteAllData.confirmWord").trim().toLowerCase();
		return typed === expected;
	});

	onInputChange(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.typedValue.set(value);
	}

	onConfirm(): void {
		if (this.isMatch()) {
			this.confirmed.emit();
		}
	}

	onCancel(): void {
		this.cancelled.emit();
	}
}
