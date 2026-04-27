import { Component, ChangeDetectionStrategy, input, inject, signal, computed, OnDestroy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { RequestReviewUseCase } from "../../primary_ports/session-list/request-review.usecase";

const SHOW_TIPS_FOR_N_SESSIONS = 6;

const ONBOARDING_TIPS = [
	"sessionList.tips.0",
	"sessionList.tips.1",
	"sessionList.tips.2",
	"sessionList.tips.3",
	"sessionList.tips.4",
	"sessionList.tips.5",
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

	private readonly _tipIndex = signal(Math.floor(Math.random() * ONBOARDING_TIPS.length));
	readonly onboardingTip = computed(() => ONBOARDING_TIPS[this._tipIndex()]);

	readonly showOnboarding = computed(() => {
		const count = this.sessionCount();
		return count > 0 && count < SHOW_TIPS_FOR_N_SESSIONS;
	});

	constructor() {
		this._tipIntervalId = setInterval(() => {
			if (this.showOnboarding()) {
				this.onNextTip();
			}
		}, 10000);
	}

	onNextTip(): void {
		this._tipIndex.update((i) => (i + 1) % ONBOARDING_TIPS.length);
	}

	ngOnDestroy(): void {
		clearInterval(this._tipIntervalId);
	}

	readonly showReview = computed(() => {
		const count = this.sessionCount();
		const hasRequested = this.requestReviewUseCase.hasRequested();
		return count >= SHOW_TIPS_FOR_N_SESSIONS && !this.justReviewed() && !hasRequested && !this.dismissed();
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
