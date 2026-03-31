import { Component, input, output, ChangeDetectionStrategy, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ChronoState } from "../../core_logic/exercise-chrono/exercise-chrono.service";
import { HapticService } from "../../core_logic/shared/haptic.service";

@Component({
	selector: "app-chrono-actions",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	styles: [
		`
			.chrono-actions {
				display: flex;
				gap: 12px;
				margin-top: 40px;
				flex-wrap: nowrap;
				justify-content: center;
				width: 100%;
			}
			.chrono-btn {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 10px;
				cursor: pointer;
				flex: 0 0 auto;
			}
			.chrono-btn-icon {
				width: 80px;
				height: 80px;
				border-radius: 20px;
				border: 1px solid var(--border);
				background: var(--card);
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.18s;
			}
			.chrono-btn-icon svg {
				width: 32px;
				height: 32px;
			}
			.chrono-btn:hover .chrono-btn-icon {
				border-color: var(--orange);
				background: var(--orange-dim);
				transform: translateY(-2px);
			}
			.chrono-btn.danger .chrono-btn-icon {
				border-color: rgba(239, 68, 68, 0.3);
				background: rgba(239, 68, 68, 0.08);
			}
			.chrono-btn.danger:hover .chrono-btn-icon {
				border-color: var(--red);
				background: rgba(239, 68, 68, 0.15);
			}
			.chrono-btn-label {
				font-family: "Space Grotesk", sans-serif;
				font-size: 14px;
				font-weight: 700;
				color: var(--sub);
				letter-spacing: 0.5px;
			}
			.chrono-btn.danger .chrono-btn-label {
				color: var(--red);
			}
			.add-time-actions {
				display: flex;
				gap: 12px;
				justify-content: center;
				margin-top: 16px;
			}
			.add-time-btn {
				font-family: "Space Grotesk", sans-serif;
				font-size: 14px;
				font-weight: 700;
				color: var(--sub);
				background: var(--card);
				border: 1px solid var(--border);
				border-radius: 12px;
				padding: 8px 20px;
				cursor: pointer;
				letter-spacing: 0.5px;
				transition: all 0.18s;
			}
			.add-time-btn:hover {
				color: var(--text);
				border-color: var(--orange);
				background: var(--orange-dim);
			}
		`,
	],
	template: `
		@if (chronoState() === "break" || chronoState() === "break_paused") {
			<div class="add-time-actions">
				<button class="add-time-btn" (click)="onAddTime(-10)">-10s</button>
				<button class="add-time-btn" (click)="onAddTime(10)">+10s</button>
			</div>
		}

		<div class="chrono-actions">
			@if (chronoState() === "initial") {
				<div class="chrono-btn" (click)="start.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<polygon points="10,7 26,16 10,25" fill="#4caf50" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "chrono.startTraining" | translate }}</span>
				</div>
			}

			@if (chronoState() === "training") {
				<div class="chrono-btn" (click)="pause.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="7" y="8" width="5" height="16" rx="2" fill="#4caf50" />
							<rect x="20" y="8" width="5" height="16" rx="2" fill="#4caf50" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "common.pause" | translate }}</span>
				</div>
			}

			@if (chronoState() === "training_paused") {
				<div class="chrono-btn" (click)="resume.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<polygon points="10,7 26,16 10,25" fill="#4caf50" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "common.resume" | translate }}</span>
				</div>
				<div class="chrono-btn danger" (click)="reset.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M16 7 A9 9 0 1 0 25 16" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" fill="none" />
							<polygon points="22,8 28,14 28,7" fill="#ef4444" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "common.reset" | translate }}</span>
				</div>
				<div class="chrono-btn" (click)="goBreak.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="7" y="8" width="5" height="16" rx="2" fill="#f5a623" />
							<rect x="20" y="8" width="5" height="16" rx="2" fill="#f5a623" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "chrono.goBreak" | translate }}</span>
				</div>
			}

			@if (chronoState() === "break") {
				<div class="chrono-btn" (click)="goTraining.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<polygon points="10,7 26,16 10,25" fill="#4caf50" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "chrono.goTraining" | translate }}</span>
				</div>
				<div class="chrono-btn" (click)="pause.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="7" y="8" width="5" height="16" rx="2" fill="#f5a623" />
							<rect x="20" y="8" width="5" height="16" rx="2" fill="#f5a623" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "common.pause" | translate }}</span>
				</div>
			}

			@if (chronoState() === "break_paused") {
				<div class="chrono-btn" (click)="resume.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<polygon points="10,7 26,16 10,25" fill="#f5a623" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "common.resume" | translate }}</span>
				</div>
				<div class="chrono-btn danger" (click)="reset.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M16 7 A9 9 0 1 0 25 16" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" fill="none" />
							<polygon points="22,8 28,14 28,7" fill="#ef4444" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "common.reset" | translate }}</span>
				</div>
				<div class="chrono-btn" (click)="goTraining.emit()">
					<div class="chrono-btn-icon">
						<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<polygon points="10,7 26,16 10,25" fill="#4caf50" />
						</svg>
					</div>
					<span class="chrono-btn-label">{{ "chrono.goTraining" | translate }}</span>
				</div>
			}
		</div>
	`,
})
export class ChronoActionsComponent {
	private readonly haptic = inject(HapticService);

	readonly chronoState = input.required<ChronoState>();

	readonly start = output<void>();
	readonly pause = output<void>();
	readonly resume = output<void>();
	readonly reset = output<void>();
	readonly goBreak = output<void>();
	readonly goTraining = output<void>();
	readonly addTime = output<number>();

	onAddTime(seconds: number): void {
		this.haptic.vibrate();
		this.addTime.emit(seconds);
	}
}
