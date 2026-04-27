import { Component, ChangeDetectionStrategy, input, output, HostListener } from "@angular/core";

@Component({
	selector: "app-photo-modal",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="photo-modal-overlay" (click)="closeModal()">
			<div class="photo-modal-content" (click)="$event.stopPropagation()">
				<button type="button" class="photo-modal-close" (click)="closeModal()" aria-label="Close">&#x2715;</button>
				<img [src]="dataUrl()" alt="" class="photo-modal-img" />
			</div>
		</div>
	`,
	styles: [`
		.photo-modal-overlay {
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.85);
			z-index: 1000;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.photo-modal-content {
			position: relative;
			max-width: 90vw;
			max-height: 90vh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.photo-modal-img {
			max-width: 100%;
			max-height: 90vh;
			object-fit: contain;
			border-radius: 8px;
		}
		.photo-modal-close {
			position: absolute;
			top: -16px;
			right: -16px;
			width: 32px;
			height: 32px;
			border-radius: 50%;
			border: none;
			background: rgba(255, 255, 255, 0.2);
			color: #fff;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 14px;
		}
	`],
})
export class PhotoModalComponent {
	readonly dataUrl = input.required<string>();
	readonly close = output<void>();

	closeModal(): void {
		this.close.emit();
	}

	@HostListener("document:keydown", ["$event"])
	onKeydown(event: KeyboardEvent): void {
		if (event.key === "Escape") {
			this.close.emit();
		}
	}
}
