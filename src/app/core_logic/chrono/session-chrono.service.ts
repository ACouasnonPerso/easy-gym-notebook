import { Injectable, PLATFORM_ID, inject, signal, Signal, untracked } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

export type ChronoStatus = "running" | "paused" | "ended";

interface SessionChronoState {
	elapsed: ReturnType<typeof signal<number>>;
	status: ReturnType<typeof signal<ChronoStatus>>;
	intervalId: ReturnType<typeof setInterval> | null;
	startTime: number | null;
	pausedElapsed: number;
}

@Injectable({ providedIn: "root" })
export class SessionChronoService {
	private readonly platformId = inject(PLATFORM_ID);

	private readonly _elapsedSeconds = signal<number>(0);
	readonly elapsedSeconds = this._elapsedSeconds.asReadonly();

	private readonly _status = signal<ChronoStatus>("running");
	readonly status = this._status.asReadonly();

	private _intervalId: ReturnType<typeof setInterval> | null = null;
	private _startTime: number | null = null;
	private _pausedElapsed = 0;

	constructor() {
		this.restoreFromStorage();
	}

	start(): void {
		this.clearInterval();
		this._pausedElapsed = 0;
		this._elapsedSeconds.set(0);
		const now = Date.now();
		this._startTime = now;
		this._status.set("running");
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem("egn_chrono_paused");
			localStorage.setItem("egn_chrono_start", String(now));
		}
		this.startInterval();
	}

	pause(): void {
		this.clearInterval();
		this._pausedElapsed = this._elapsedSeconds();
		this._status.set("paused");
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem("egn_chrono_start");
			localStorage.setItem("egn_chrono_paused", String(this._pausedElapsed));
		}
	}

	resumeSession(): void {
		this._startTime = Date.now() - this._pausedElapsed * 1000;
		this._status.set("running");
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem("egn_chrono_paused");
			localStorage.setItem("egn_chrono_start", String(this._startTime));
		}
		this.startInterval();
	}

	stop(): number {
		this.clearInterval();
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem("egn_chrono_start");
			localStorage.removeItem("egn_chrono_paused");
		}
		const elapsed = this._elapsedSeconds();
		this._status.set("ended");
		this._startTime = null;
		return elapsed;
	}

	overrideElapsed(seconds: number): void {
		this.clearInterval();
		this._pausedElapsed = seconds;
		this._elapsedSeconds.set(seconds);
		this._startTime = Date.now() - seconds * 1000;
		this._status.set("running");
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem("egn_chrono_paused");
			localStorage.setItem("egn_chrono_start", String(this._startTime));
		}
		this.startInterval();
	}

	getElapsed(): number {
		return this._elapsedSeconds();
	}

	// ---------------------------------------------------------------------------
	// Multi-session API (stubs — behavioral logic added incrementally by TDD)
	// ---------------------------------------------------------------------------

	private readonly _sessions = new Map<string, SessionChronoState>();

	private _getOrCreateSession(sessionId: string): SessionChronoState {
		if (!this._sessions.has(sessionId)) {
			const state: SessionChronoState = {
				elapsed: signal<number>(0),
				status: signal<ChronoStatus>("paused"),
				intervalId: null,
				startTime: null,
				pausedElapsed: 0,
			};
			this._sessions.set(sessionId, state);
			this.restoreSessionFromStorage(sessionId, state);
		}
		return this._sessions.get(sessionId)!;
	}

	startForSession(sessionId: string): void {
		const state = this._getOrCreateSession(sessionId);
		// No-op if already running (normal start or restored from storage).
		// No-op if paused with saved elapsed (restored from storage — wait for explicit resumeForSession).
		if (state.status() === "running") return;
		if (state.pausedElapsed > 0) return;
		if (state.intervalId !== null) {
			clearInterval(state.intervalId);
			state.intervalId = null;
		}
		state.pausedElapsed = 0;
		state.elapsed.set(0);
		state.startTime = Date.now();
		state.status.set("running");
		if (isPlatformBrowser(this.platformId))
			localStorage.setItem(`egn_chrono_start_${sessionId}`, String(state.startTime));
		state.intervalId = setInterval(() => {
			state.elapsed.set(Math.floor((Date.now() - state.startTime!) / 1000));
		}, 1000);
	}

	pauseForSession(sessionId: string): void {
		const state = this._sessions.get(sessionId);
		if (!state) return;
		if (state.intervalId !== null) {
			clearInterval(state.intervalId);
			state.intervalId = null;
		}
		state.pausedElapsed = state.elapsed();
		state.status.set("paused");
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem(`egn_chrono_start_${sessionId}`);
			localStorage.setItem(`egn_chrono_paused_${sessionId}`, String(state.pausedElapsed));
		}
	}

	resumeForSession(sessionId: string): void {
		const state = this._getOrCreateSession(sessionId);
		if (state.intervalId !== null) {
			clearInterval(state.intervalId);
			state.intervalId = null;
		}
		state.startTime = Date.now() - state.pausedElapsed * 1000;
		state.status.set("running");
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem(`egn_chrono_paused_${sessionId}`);
			localStorage.removeItem(`egn_chrono_ended_${sessionId}`);
			localStorage.setItem(`egn_chrono_start_${sessionId}`, String(state.startTime));
		}
		state.intervalId = setInterval(() => {
			state.elapsed.set(Math.floor((Date.now() - state.startTime!) / 1000));
		}, 1000);
	}

	stopForSession(sessionId: string): number {
		const state = this._sessions.get(sessionId);
		if (!state) return 0;
		if (state.intervalId !== null) {
			clearInterval(state.intervalId);
			state.intervalId = null;
		}
		const elapsed = state.elapsed();
		state.pausedElapsed = elapsed;
		state.status.set("ended");
		state.startTime = null;
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem(`egn_chrono_start_${sessionId}`);
			localStorage.removeItem(`egn_chrono_paused_${sessionId}`);
			localStorage.setItem(`egn_chrono_ended_${sessionId}`, String(elapsed));
		}
		return elapsed;
	}

	getElapsedForSession(sessionId: string): number {
		const state = this._sessions.get(sessionId);
		return state ? state.elapsed() : 0;
	}

	getStatusForSession(sessionId: string): ChronoStatus {
		const state = this._sessions.get(sessionId);
		return state ? state.status() : "paused";
	}

	elapsedSignalForSession(sessionId: string): Signal<number> {
		return this._getOrCreateSession(sessionId).elapsed.asReadonly();
	}

	statusSignalForSession(sessionId: string): Signal<ChronoStatus> {
		return this._getOrCreateSession(sessionId).status.asReadonly();
	}

	overrideElapsedForSession(sessionId: string, seconds: number): void {
		const state = this._getOrCreateSession(sessionId);
		if (state.intervalId !== null) {
			clearInterval(state.intervalId);
			state.intervalId = null;
		}
		state.pausedElapsed = seconds;
		state.elapsed.set(seconds);
		state.startTime = Date.now() - seconds * 1000;
		state.status.set("running");
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem(`egn_chrono_paused_${sessionId}`);
			localStorage.setItem(`egn_chrono_start_${sessionId}`, String(state.startTime));
		}
		state.intervalId = setInterval(() => {
			state.elapsed.set(Math.floor((Date.now() - state.startTime!) / 1000));
		}, 1000);
	}

	private restoreSessionFromStorage(sessionId: string, state: SessionChronoState): boolean {
		if (!isPlatformBrowser(this.platformId)) return false;
		const storedPaused = localStorage.getItem(`egn_chrono_paused_${sessionId}`);
		if (storedPaused) {
			state.pausedElapsed = parseInt(storedPaused);
			state.startTime = null;
			untracked(() => {
				state.elapsed.set(state.pausedElapsed);
				state.status.set("paused");
			});
			return true;
		}
		const storedStart = localStorage.getItem(`egn_chrono_start_${sessionId}`);
		if (storedStart) {
			state.startTime = parseInt(storedStart);
			untracked(() => {
				state.elapsed.set(Math.floor((Date.now() - state.startTime!) / 1000));
				state.status.set("running");
			});
			state.intervalId = setInterval(() => {
				state.elapsed.set(Math.floor((Date.now() - state.startTime!) / 1000));
			}, 1000);
			return true;
		}
		const storedEnded = localStorage.getItem(`egn_chrono_ended_${sessionId}`);
		if (storedEnded) {
			state.pausedElapsed = parseInt(storedEnded);
			state.startTime = null;
			untracked(() => {
				state.elapsed.set(state.pausedElapsed);
				state.status.set("ended");
			});
			return true;
		}
		return false;
	}

	private restoreFromStorage(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		const paused = localStorage.getItem("egn_chrono_paused");
		if (paused) {
			this._pausedElapsed = parseInt(paused);
			this._elapsedSeconds.set(this._pausedElapsed);
			this._status.set("paused");
			return;
		}
		const stored = localStorage.getItem("egn_chrono_start");
		if (!stored) return;
		this._startTime = parseInt(stored);
		this._status.set("running");
		this.startInterval();
	}

	private startInterval(): void {
		this._intervalId = setInterval(() => {
			const elapsed = Math.floor((Date.now() - this._startTime!) / 1000);
			this._elapsedSeconds.set(elapsed);
		}, 1000);
	}

	private clearInterval(): void {
		if (this._intervalId !== null) {
			clearInterval(this._intervalId);
			this._intervalId = null;
		}
	}
}
