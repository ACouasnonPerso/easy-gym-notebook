import { computed, inject, Injectable, PLATFORM_ID, signal } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Capacitor } from "@capacitor/core";
import { NativeAudio } from "@capacitor-community/native-audio";

export type ChronoState = "initial" | "training" | "training_paused" | "break" | "break_paused";

@Injectable({ providedIn: "root" })
export class ExerciseChronoService {
	private readonly platformId = inject(PLATFORM_ID);

	private readonly _chronoState = signal<ChronoState>("initial");
	readonly chronoState = this._chronoState.asReadonly();
	/** Backward-compat: 'exercise' when training, 'pause' when on break */
	readonly mode = computed<"pause" | "exercise">(() => {
		const s = this._chronoState();
		return s === "break" || s === "break_paused" ? "pause" : "exercise";
	});
	private readonly _timeSeconds = signal<number>(0);
	readonly timeSeconds = this._timeSeconds.asReadonly();
	private readonly _breakDuration = signal<number>(60);
	private readonly _seriesCount = signal<number>(0);
	readonly seriesCount = this._seriesCount.asReadonly();
	private readonly _soundEnabled = signal<boolean>(true);
	readonly soundEnabled = this._soundEnabled.asReadonly();
	private _intervalId: ReturnType<typeof setInterval> | null = null;
	private _visibilityChangeListener: (() => void) | null = null;
	/** Timestamp (ms) at which the current timer segment was started. */
	private _timerStartedAtMs: number = 0;
	/** Value of _timeSeconds at the moment the current timer segment was started. */
	private _timeAtStart: number = 0;
	private _soundsPreloaded = false;

	toggleSound(): void {
		this._soundEnabled.update((v) => !v);
	}

	/** Update break duration without resetting chrono state. */
	updateBreakDuration(breakDuration: number): void {
		this._breakDuration.set(breakDuration);
		const s = this._chronoState();
		if (s === "break" || s === "break_paused") {
			this._timeSeconds.set(breakDuration);
		}
	}

	/** Called once on page load to configure break duration. Does NOT start the timer. */
	init(breakDuration: number): void {
		this.clearTimer();
		this.removeVisibilityListener();
		this._breakDuration.set(breakDuration);
		this._chronoState.set("initial");
		this._timeSeconds.set(0);
		this._seriesCount.set(0);
		this.preloadSounds();
	}

	/** Start training from initial state. */
	start(): void {
		if (this._chronoState() !== "initial") return;
		this._chronoState.set("training");
		this._timeSeconds.set(0);
		this._seriesCount.update((n) => n + 1);
		this.startCountup();
		this.persist();
	}

	/** Pause current training or break timer. */
	pause(): void {
		const s = this._chronoState();
		if (s === "training") {
			this.clearTimer();
			this.removeVisibilityListener();
			this._chronoState.set("training_paused");
			this.persist();
		} else if (s === "break") {
			this.clearTimer();
			this.removeVisibilityListener();
			this._chronoState.set("break_paused");
			this.persist();
		}
	}

	/** Resume from a paused state. */
	resume(): void {
		const s = this._chronoState();
		if (s === "training_paused") {
			this._chronoState.set("training");
			this.startCountup();
			this.persist();
		} else if (s === "break_paused") {
			this._chronoState.set("break");
			this.startCountdown();
			this.persist();
		}
	}

	/** Reset timer in place: stays in same mode (training or break) but time resets to 0 / breakDuration. */
	reset(): void {
		const s = this._chronoState();
		this.clearTimer();
		if (s === "training_paused") {
			this._chronoState.set("training");
			this._timeSeconds.set(0);
			this.startCountup();
			this.persist();
		} else if (s === "break_paused") {
			this._chronoState.set("break");
			this._timeSeconds.set(this._breakDuration());
			this.startCountdown();
			this.persist();
		}
	}

	/** Switch from training (or training_paused) to break. */
	goBreak(): void {
		this.clearTimer();
		this._chronoState.set("break");
		this._timeSeconds.set(this._breakDuration());
		this.startCountdown();
		this.persist();
	}

	/** Switch from break (or break_paused) to training. */
	goTraining(): void {
		this.clearTimer();
		this._chronoState.set("training");
		this._timeSeconds.set(0);
		this._seriesCount.update((n) => n + 1);
		this.startCountup();
		this.persist();
	}

	startCountdown(): void {
		this._timerStartedAtMs = Date.now();
		this._timeAtStart = this._timeSeconds();
		this.addVisibilityListener("countdown");
		this._intervalId = setInterval(() => {
			const elapsed = Math.floor((Date.now() - this._timerStartedAtMs) / 1000);
			const remaining = this._timeAtStart - elapsed;
			this._timeSeconds.set(remaining);
			if (remaining <= 0) {
				this.clearTimer();
				this.removeVisibilityListener();
				this.playBeep();
				this._chronoState.set("training");
				this._timeSeconds.set(0);
				this._seriesCount.update((n) => n + 1);
				this.startCountup();
			} else if (remaining === 10) this.playCountdownSound("ten");
			else if (remaining === 3) this.playCountdownSound("three");
			else if (remaining === 2) this.playCountdownSound("two");
			else if (remaining === 1) this.playCountdownSound("one");
		}, 1000);
	}

	playCountdownSound(name: "ten" | "three" | "two" | "one"): void {
		if (!isPlatformBrowser(this.platformId) || !this._soundEnabled()) return;
		if (Capacitor.isNativePlatform()) {
			NativeAudio.play({ assetId: name }).catch(() => {});
		} else {
			new Audio(`assets/sounds/${name}.mp3`).play().catch(() => {});
		}
	}

	startCountup(): void {
		this._timerStartedAtMs = Date.now();
		this._timeAtStart = this._timeSeconds();
		this.addVisibilityListener("countup");
		this._intervalId = setInterval(() => {
			const elapsed = Math.floor((Date.now() - this._timerStartedAtMs) / 1000);
			this._timeSeconds.set(this._timeAtStart + elapsed);
		}, 1000);
	}

	playBeep(): void {
		if (!isPlatformBrowser(this.platformId) || !this._soundEnabled()) return;
		if (Capacitor.isNativePlatform()) {
			NativeAudio.play({ assetId: "alert" }).catch(() => {});
		} else {
			new Audio("sounds/alert.wav").play().catch(() => {});
		}
	}

	persist(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		localStorage.setItem(
			"egn_exercise_chrono",
			JSON.stringify({
				breakDuration: this._breakDuration(),
				timerStartedAtMs: this._timerStartedAtMs,
				timeAtStart: this._timeAtStart,
				state: this._chronoState(),
			})
		);
	}

	restoreFromPersist(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		const raw = localStorage.getItem("egn_exercise_chrono");
		if (!raw) return;
		try {
			const data = JSON.parse(raw) as {
				breakDuration: number;
				timerStartedAtMs: number;
				timeAtStart: number;
				state: ChronoState;
			};
			this._breakDuration.set(data.breakDuration);
			this._timerStartedAtMs = data.timerStartedAtMs;
			this._timeAtStart = data.timeAtStart;
			this._chronoState.set(data.state);
			const elapsed = Math.floor((Date.now() - data.timerStartedAtMs) / 1000);
			const s = data.state;
			if (s === "training") {
				this._timeSeconds.set(data.timeAtStart + elapsed);
				this.startCountup();
			} else if (s === "break") {
				const remaining = Math.max(0, data.timeAtStart - elapsed);
				this._timeSeconds.set(remaining);
				if (remaining > 0) this.startCountdown();
				else {
					this._chronoState.set("training");
					this._timeSeconds.set(0);
					this._seriesCount.update((n) => n + 1);
					this.startCountup();
				}
			} else if (s === "training_paused") {
				this._timeSeconds.set(data.timeAtStart);
			} else if (s === "break_paused") {
				this._timeSeconds.set(data.timeAtStart);
			}
		} catch (e) {
			/* ignore malformed data */
		}
	}

	incrementSeriesCount(): void {
		this._seriesCount.update((n) => n + 1);
	}

	decrementSeriesCount(): void {
		this._seriesCount.update((n) => Math.max(1, n - 1));
	}

	addTime(seconds: number): void {
		const s = this._chronoState();
		if (s !== "break_paused" && s !== "break") return;
		this._timeSeconds.update((t) => t + seconds);
		if (s === "break") {
			this._timerStartedAtMs = Date.now();
			this._timeAtStart = this._timeSeconds();
		}
	}

	private async preloadSounds(): Promise<void> {
		if (!Capacitor.isNativePlatform() || this._soundsPreloaded) return;
		this._soundsPreloaded = true;
		await Promise.all([
			NativeAudio.preload({ assetId: "ten", assetPath: "public/assets/sounds/ten.mp3" }),
			NativeAudio.preload({ assetId: "three", assetPath: "public/assets/sounds/three.mp3" }),
			NativeAudio.preload({ assetId: "two", assetPath: "public/assets/sounds/two.mp3" }),
			NativeAudio.preload({ assetId: "one", assetPath: "public/assets/sounds/one.mp3" }),
			NativeAudio.preload({ assetId: "alert", assetPath: "public/sounds/alert.wav" }),
		]);
	}

	private clearTimer(): void {
		if (this._intervalId !== null) {
			clearInterval(this._intervalId);
			this._intervalId = null;
		}
	}

	private addVisibilityListener(mode: "countup" | "countdown"): void {
		if (!isPlatformBrowser(this.platformId)) return;
		this.removeVisibilityListener();
		this._visibilityChangeListener = () => {
			if (document.visibilityState !== "visible") return;
			const elapsed = Math.floor((Date.now() - this._timerStartedAtMs) / 1000);
			if (mode === "countup") this._timeSeconds.set(this._timeAtStart + elapsed);
			else this._timeSeconds.set(Math.max(0, this._timeAtStart - elapsed));
		};
		document.addEventListener("visibilitychange", this._visibilityChangeListener);
	}

	private removeVisibilityListener(): void {
		if (!isPlatformBrowser(this.platformId) || !this._visibilityChangeListener) return;
		document.removeEventListener("visibilitychange", this._visibilityChangeListener);
		this._visibilityChangeListener = null;
	}
}
