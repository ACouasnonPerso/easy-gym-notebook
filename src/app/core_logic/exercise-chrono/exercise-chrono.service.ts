import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ChronoState = 'initial' | 'training' | 'training_paused' | 'break' | 'break_paused';

@Injectable({ providedIn: 'root' })
export class ExerciseChronoService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _chronoState = signal<ChronoState>('initial');
  private readonly _timeSeconds = signal<number>(0);
  private readonly _breakDuration = signal<number>(60);
  private readonly _seriesCount = signal<number>(0);

  readonly chronoState = this._chronoState.asReadonly();
  readonly timeSeconds = this._timeSeconds.asReadonly();
  readonly seriesCount = this._seriesCount.asReadonly();

  /** Backward-compat: 'exercise' when training, 'pause' when on break */
  readonly mode = computed<'pause' | 'exercise'>(() => {
    const s = this._chronoState();
    return s === 'break' || s === 'break_paused' ? 'pause' : 'exercise';
  });

  private _intervalId: ReturnType<typeof setInterval> | null = null;

  /** Update break duration without resetting chrono state. */
  updateBreakDuration(breakDuration: number): void {
    this._breakDuration.set(breakDuration);
    const s = this._chronoState();
    if (s === 'break' || s === 'break_paused') {
      this._timeSeconds.set(breakDuration);
    }
  }

  /** Called once on page load to configure break duration. Does NOT start the timer. */
  init(breakDuration: number): void {
    this.clearTimer();
    this._breakDuration.set(breakDuration);
    this._chronoState.set('initial');
    this._timeSeconds.set(0);
    this._seriesCount.set(0);
  }

  /** Start training from initial state. */
  start(): void {
    if (this._chronoState() !== 'initial') return;
    this._chronoState.set('training');
    this._timeSeconds.set(0);
    this._seriesCount.update(n => n + 1);
    this.startCountup();
    this.persist();
  }

  /** Pause current training or break timer. */
  pause(): void {
    const s = this._chronoState();
    if (s === 'training') {
      this.clearTimer();
      this._chronoState.set('training_paused');
      this.persist();
    } else if (s === 'break') {
      this.clearTimer();
      this._chronoState.set('break_paused');
      this.persist();
    }
  }

  /** Resume from a paused state. */
  resume(): void {
    const s = this._chronoState();
    if (s === 'training_paused') {
      this._chronoState.set('training');
      this.startCountup();
      this.persist();
    } else if (s === 'break_paused') {
      this._chronoState.set('break');
      this.startCountdown();
      this.persist();
    }
  }

  /** Reset timer in place: stays in same mode (training or break) but time resets to 0 / breakDuration. */
  reset(): void {
    const s = this._chronoState();
    this.clearTimer();
    if (s === 'training_paused') {
      this._chronoState.set('training');
      this._timeSeconds.set(0);
      this.startCountup();
      this.persist();
    } else if (s === 'break_paused') {
      this._chronoState.set('break');
      this._timeSeconds.set(this._breakDuration());
      this.startCountdown();
      this.persist();
    }
  }

  /** Switch from training (or training_paused) to break. */
  goBreak(): void {
    this.clearTimer();
    this._chronoState.set('break');
    this._timeSeconds.set(this._breakDuration());
    this.startCountdown();
    this.persist();
  }

  /** Switch from break (or break_paused) to training. */
  goTraining(): void {
    this.clearTimer();
    this._chronoState.set('training');
    this._timeSeconds.set(0);
    this._seriesCount.update(n => n + 1);
    this.startCountup();
    this.persist();
  }

  startCountdown(): void {
    this._intervalId = setInterval(() => {
      this._timeSeconds.update(t => t - 1);
      const remaining = this._timeSeconds();
      if (remaining <= 0) {
        this.clearTimer();
        this.playBeep();
        this._chronoState.set('training');
        this._timeSeconds.set(0);
        this._seriesCount.update(n => n + 1);
        this.startCountup();
      } else if (remaining === 10) this.playCountdownSound('ten');
      else if (remaining === 3) this.playCountdownSound('three');
      else if (remaining === 2) this.playCountdownSound('two');
      else if (remaining === 1) this.playCountdownSound('one');
    }, 1000);
  }

  playCountdownSound(name: 'ten' | 'three' | 'two' | 'one'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const audio = new Audio(`assets/sounds/${name}.mp3`);
      audio.play().catch(() => { /* ignore autoplay policy errors */ });
    } catch (e) { /* ignore */ }
  }

  startCountup(): void {
    this._intervalId = setInterval(() => {
      this._timeSeconds.update(t => t + 1);
    }, 1000);
  }

  playBeep(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const audio = new Audio('sounds/alert.wav');
      audio.play().catch(() => { /* ignore autoplay policy errors */ });
    } catch (e) { /* ignore */ }
  }

  persist(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('egn_exercise_chrono', JSON.stringify({
      breakDuration: this._breakDuration(),
      startedAt: Date.now(),
      state: this._chronoState(),
    }));
  }

  private clearTimer(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }
}
