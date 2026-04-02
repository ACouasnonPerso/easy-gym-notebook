import { Component, ChangeDetectionStrategy, input, inject, signal, computed, OnDestroy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { RequestReviewUseCase } from "../../primary_ports/session-list/request-review.usecase";

const ONBOARDING_TIPS = [
	"Long press a session to duplicate it",
	'Try to name an exercice "velo" or "running" to activate mode cardio 🏃‍♂️',
	"The exercice automatically detect the muscles with the name 💪",
	"You can rate the exercice difficulty 2️⃣0️⃣",
	"Try to select the current year in stats to see your yearly heatmap 😉",
];

@Component({
	selector: "app-tips-banner",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./tips-banner.component.html",
	styleUrl: "./tips-banner.component.scss",
})
export class TipsBannerComponent implements OnDestroy {
	readonly sessionCount = input.required<number>();

	private readonly requestReviewUseCase = inject(RequestReviewUseCase);

	private readonly justReviewed = signal(false);
	private readonly pending = signal(false);
	private readonly dismissed = signal(false);
	readonly showConfirm = signal(false);

	private readonly _tipIntervalId: ReturnType<typeof setInterval>;

	readonly onboardingTip = signal<string>(ONBOARDING_TIPS[Math.floor(Math.random() * ONBOARDING_TIPS.length)]);

	readonly showOnboarding = computed(() => {
		const count = this.sessionCount();
		return count > 0 && count < 4;
	});

	constructor() {
		this._tipIntervalId = setInterval(() => {
			if (this.showOnboarding()) {
				this.onboardingTip.set(ONBOARDING_TIPS[Math.floor(Math.random() * ONBOARDING_TIPS.length)]);
			}
		}, 5000);
	}

	ngOnDestroy(): void {
		clearInterval(this._tipIntervalId);
	}

	readonly showReview = computed(() => {
		const count = this.sessionCount();
		const hasRequested = this.requestReviewUseCase.hasRequested();
		return count >= 4 && !this.justReviewed() && !hasRequested && !this.dismissed();
	});

	readonly showThanks = computed(() => {
		return this.justReviewed();
	});

	onReviewClick(): void {
		if (this.pending()) return;
		this.showConfirm.set(true);
	}

	async onConfirmYes(): Promise<void> {
		if (this.pending()) return;
		this.showConfirm.set(false);
		this.pending.set(true);
		const success = await this.requestReviewUseCase.execute();
		this.pending.set(false);
		if (success) this.justReviewed.set(true);
	}

	onConfirmNo(): void {
		this.showConfirm.set(false);
		this.dismissed.set(true);
	}
}
