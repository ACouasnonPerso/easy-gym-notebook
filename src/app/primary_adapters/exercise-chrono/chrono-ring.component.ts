import { Component, input, ChangeDetectionStrategy } from "@angular/core";

@Component({
	selector: "app-chrono-ring",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: [
		`
			.chrono-ring-wrap {
				position: relative;
				width: 200px;
				height: 200px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.chrono-ring-svg {
				position: absolute;
				top: 0;
				left: 0;
				transform: rotate(-90deg);
			}
			.chrono-ring-track {
				fill: none;
				stroke: var(--card2);
				stroke-width: 6;
			}
			.chrono-ring-fill {
				fill: none;
				stroke-width: 6;
				stroke-linecap: round;
				stroke-dasharray: 565;
				stroke-dashoffset: 0;
				transition: stroke-dashoffset 0.4s;
			}
			.chrono-inner {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 4px;
				z-index: 1;
			}
			.chrono-time {
				font-family: "IBM Plex Mono", monospace;
				font-size: 56px;
				font-weight: 600;
				color: var(--text);
				letter-spacing: -3px;
				line-height: 1;
			}
			.chrono-label {
				font-family: "Space Grotesk", sans-serif;
				font-size: 13px;
				font-weight: 700;
				letter-spacing: 3px;
				text-transform: uppercase;
			}
			@keyframes blink {
				0%,
				100% {
					opacity: 1;
				}
				50% {
					opacity: 0;
				}
			}
			.blinking {
				animation: blink 0.5s step-start infinite;
			}
		`,
	],
	template: `
		<div class="chrono-ring-wrap">
			<svg class="chrono-ring-svg" width="200" height="200" viewBox="0 0 200 200">
				<circle class="chrono-ring-track" cx="100" cy="100" r="90" />
				<circle
					class="chrono-ring-fill"
					cx="100"
					cy="100"
					r="90"
					[attr.stroke]="ringColor()"
					[attr.stroke-dashoffset]="ringOffset()"
				/>
			</svg>
			<div class="chrono-inner">
				<div class="chrono-time" [class.blinking]="isBlinking()">{{ formattedTime() }}</div>
				<div class="chrono-label" [style.color]="ringColor()">{{ statusLabel() }}</div>
			</div>
		</div>
	`,
})
export class ChronoRingComponent {
	readonly formattedTime = input.required<string>();
	readonly statusLabel = input.required<string>();
	readonly ringColor = input.required<string>();
	readonly ringOffset = input.required<number>();
	readonly isBlinking = input<boolean>(false);
}
