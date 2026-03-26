import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ExerciseChronoUseCase } from '../../primary_ports/exercise-chrono/exercise-chrono.usecase';
import { EditDurationPopupComponent } from '../session-detail/edit-duration-popup.component';

@Component({
  selector: 'app-exercise-chrono',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditDurationPopupComponent],
  styles: [`
    :host { display: block; }
    .page {
      background: var(--bg);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header-pad {
      padding: 24px 20px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--sub);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: fit-content;
      transition: color 0.15s;
    }
    .back-btn:hover { color: var(--text); }
    .back-arrow { font-size: 18px; line-height: 1; }
    .break-duration-label {
      font-family: 'Syne', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 4px 10px;
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: background 0.15s;
    }
    .break-duration-label:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .chrono-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px 20px;
    }
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
      top: 0; left: 0;
      transform: rotate(-90deg);
    }
    .chrono-ring-track { fill: none; stroke: var(--card2); stroke-width: 6; }
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
      font-family: 'IBM Plex Mono', monospace;
      font-size: 56px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -3px;
      line-height: 1;
    }
    .chrono-label {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
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
    .chrono-btn-icon svg { width: 32px; height: 32px; }
    .chrono-btn:hover .chrono-btn-icon {
      border-color: var(--orange);
      background: var(--orange-dim);
      transform: translateY(-2px);
    }
    .chrono-btn.danger .chrono-btn-icon {
      border-color: rgba(239,68,68,0.3);
      background: rgba(239,68,68,0.08);
    }
    .chrono-btn.danger:hover .chrono-btn-icon {
      border-color: var(--red);
      background: rgba(239,68,68,0.15);
    }
    .chrono-btn-label {
      font-family: 'Syne', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--sub);
      letter-spacing: 0.5px;
    }
    .chrono-btn.danger .chrono-btn-label { color: var(--red); }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .blinking .chrono-time {
      animation: blink 0.5s step-start infinite;
    }
  `],
  template: `
    <div class="page" [class.blinking]="isBlinking()">
      <div class="header-pad">
        <div class="back-btn" (click)="location.back()"><span class="back-arrow">←</span> Back</div>
        @if (!hasExercise()) {
          <span class="break-duration-label" (click)="showBreakDurationPopup.set(true)">
            {{ formattedBreakDuration() }} repos
          </span>
        }
      </div>
      <div class="chrono-body">
        <div class="chrono-ring-wrap">
          <svg class="chrono-ring-svg" width="200" height="200" viewBox="0 0 200 200">
            <circle class="chrono-ring-track" cx="100" cy="100" r="90"/>
            <circle class="chrono-ring-fill" cx="100" cy="100" r="90"
              [attr.stroke]="ringColor()"
              [attr.stroke-dashoffset]="ringOffset()"/>
          </svg>
          <div class="chrono-inner">
            <div class="chrono-time">{{ formattedTime() }}</div>
            <div class="chrono-label" [style.color]="ringColor()">{{ statusLabel() }}</div>
          </div>
        </div>

        <div class="chrono-actions">

          <!-- INITIAL: START TRAINING -->
          @if (chronoState() === 'initial') {
            <div class="chrono-btn" (click)="exerciseChronoUseCase.start()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="10,7 26,16 10,25" fill="#4caf50"/>
                </svg>
              </div>
              <span class="chrono-btn-label">START TRAINING</span>
            </div>
          }

          <!-- TRAINING EN COURS: PAUSE -->
          @if (chronoState() === 'training') {
            <div class="chrono-btn" (click)="exerciseChronoUseCase.pause()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="8" width="5" height="16" rx="2" fill="#4caf50"/>
                  <rect x="20" y="8" width="5" height="16" rx="2" fill="#4caf50"/>
                </svg>
              </div>
              <span class="chrono-btn-label">PAUSE</span>
            </div>
          }

          <!-- TRAINING EN PAUSE: REPRENDRE + RESET + GO BREAK -->
          @if (chronoState() === 'training_paused') {
            <div class="chrono-btn" (click)="exerciseChronoUseCase.resume()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="10,7 26,16 10,25" fill="#4caf50"/>
                </svg>
              </div>
              <span class="chrono-btn-label">REPRENDRE</span>
            </div>
            <div class="chrono-btn danger" (click)="exerciseChronoUseCase.reset()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7 A9 9 0 1 0 25 16" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                  <polygon points="22,8 28,14 28,7" fill="#ef4444"/>
                </svg>
              </div>
              <span class="chrono-btn-label">RESET</span>
            </div>
            <div class="chrono-btn" (click)="exerciseChronoUseCase.goBreak()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="8" width="5" height="16" rx="2" fill="#f5a623"/>
                  <rect x="20" y="8" width="5" height="16" rx="2" fill="#f5a623"/>
                </svg>
              </div>
              <span class="chrono-btn-label">GO BREAK</span>
            </div>
          }

          <!-- BREAK EN COURS: GO TRAINING + PAUSE -->
          @if (chronoState() === 'break') {
            <div class="chrono-btn" (click)="exerciseChronoUseCase.goTraining()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="10,7 26,16 10,25" fill="#4caf50"/>
                </svg>
              </div>
              <span class="chrono-btn-label">GO TRAINING</span>
            </div>
            <div class="chrono-btn" (click)="exerciseChronoUseCase.pause()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="8" width="5" height="16" rx="2" fill="#f5a623"/>
                  <rect x="20" y="8" width="5" height="16" rx="2" fill="#f5a623"/>
                </svg>
              </div>
              <span class="chrono-btn-label">PAUSE</span>
            </div>
          }

          <!-- BREAK EN PAUSE: REPRENDRE + RESET + GO TRAINING -->
          @if (chronoState() === 'break_paused') {
            <div class="chrono-btn" (click)="exerciseChronoUseCase.resume()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="10,7 26,16 10,25" fill="#f5a623"/>
                </svg>
              </div>
              <span class="chrono-btn-label">REPRENDRE</span>
            </div>
            <div class="chrono-btn danger" (click)="exerciseChronoUseCase.reset()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7 A9 9 0 1 0 25 16" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                  <polygon points="22,8 28,14 28,7" fill="#ef4444"/>
                </svg>
              </div>
              <span class="chrono-btn-label">RESET</span>
            </div>
            <div class="chrono-btn" (click)="exerciseChronoUseCase.goTraining()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="10,7 26,16 10,25" fill="#4caf50"/>
                </svg>
              </div>
              <span class="chrono-btn-label">GO TRAINING</span>
            </div>
          }

        </div>
      </div>
    </div>

    @if (showBreakDurationPopup()) {
      <app-edit-duration-popup
        [initialSeconds]="_breakDuration()"
        (confirmed)="onBreakDurationConfirmed($event)"
        (cancelled)="showBreakDurationPopup.set(false)"
      />
    }
  `,
})
export class ExerciseChronoComponent implements OnInit {
  protected readonly exerciseChronoUseCase = inject(ExerciseChronoUseCase);
  private readonly route = inject(ActivatedRoute);
  protected readonly location = inject(Location);

  readonly _breakDuration = signal(120);
  readonly hasExercise = signal(false);
  readonly showBreakDurationPopup = signal(false);

  readonly circumference = 2 * Math.PI * 90;

  readonly chronoState = this.exerciseChronoUseCase.chronoState;

  readonly formattedTime = computed(() => {
    const s = this.exerciseChronoUseCase.timeSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  readonly formattedBreakDuration = computed(() => {
    const s = this._breakDuration();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  });

  readonly isBlinking = computed(() => {
    const state = this.exerciseChronoUseCase.chronoState();
    return this.exerciseChronoUseCase.timeSeconds() <= 3 && state === 'break';
  });

  readonly ringOffset = computed(() => {
    const state = this.exerciseChronoUseCase.chronoState();
    if (state === 'break' || state === 'break_paused') {
      return this.circumference * (1 - this.exerciseChronoUseCase.timeSeconds() / Math.max(1, this._breakDuration()));
    }
    return 0;
  });

  readonly statusLabel = computed(() => {
    const state = this.exerciseChronoUseCase.chronoState();
    if (state === 'break' || state === 'break_paused') return 'Break';
    if (state === 'initial') return 'Ready';
    return 'Training';
  });

  readonly ringColor = computed(() => {
    const state = this.exerciseChronoUseCase.chronoState();
    return (state === 'break' || state === 'break_paused') ? '#f5a623' : '#4caf50';
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.queryParams['breakDuration'];
    const parsed = parseInt(raw, 10);
    const hasParam = raw !== undefined && raw !== null && !isNaN(parsed);
    const n = hasParam ? parsed : 120;
    this._breakDuration.set(n);
    this.hasExercise.set(hasParam);
    this.exerciseChronoUseCase.initWithBreakDuration(n);
  }

  onBreakDurationConfirmed(seconds: number): void {
    this._breakDuration.set(seconds);
    this.showBreakDurationPopup.set(false);
    this.exerciseChronoUseCase.updateBreakDuration(seconds);
  }
}
