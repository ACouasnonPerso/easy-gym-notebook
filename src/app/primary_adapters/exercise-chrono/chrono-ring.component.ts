import { Component, input, ChangeDetectionStrategy } from "@angular/core";

@Component({
	selector: "app-chrono-ring",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./chrono-ring.component.html",
	styleUrl: "./chrono-ring.component.css",
})
export class ChronoRingComponent {
	readonly formattedTime = input.required<string>();
	readonly statusLabel = input.required<string>();
	readonly ringColor = input.required<string>();
	readonly ringOffset = input.required<number>();
	readonly isBlinking = input<boolean>(false);
}
