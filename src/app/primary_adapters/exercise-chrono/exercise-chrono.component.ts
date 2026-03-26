import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ExerciseChronoUseCase } from '../../primary_ports/exercise-chrono/exercise-chrono.usecase';
import { EditDurationPopupComponent } from '../session-detail/edit-duration-popup.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-exercise-chrono',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditDurationPopupComponent, TranslateModule],
  templateUrl: './exercise-chrono.component.html',
  styleUrl: './exercise-chrono.component.scss',
  template: `
    <div class="page" [class.blinking]="isBlinking()">
      <div class="header-pad">
        <div class="back-btn" (click)="location.back()"><span class="back-arrow">←</span> {{ 'common.back' | translate }}</div>
        @if (!hasExercise()) {
          <span class="break-duration-label" (click)="showBreakDurationPopup.set(true)">
            {{ formattedBreakDuration() }} {{ 'common.rest' | translate }}
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
              <span class="chrono-btn-label">{{ 'chrono.startTraining' | translate }}</span>
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
              <span class="chrono-btn-label">{{ 'common.pause' | translate }}</span>
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
              <span class="chrono-btn-label">{{ 'common.resume' | translate }}</span>
            </div>
            <div class="chrono-btn danger" (click)="exerciseChronoUseCase.reset()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7 A9 9 0 1 0 25 16" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                  <polygon points="22,8 28,14 28,7" fill="#ef4444"/>
                </svg>
              </div>
              <span class="chrono-btn-label">{{ 'common.reset' | translate }}</span>
            </div>
            <div class="chrono-btn" (click)="exerciseChronoUseCase.goBreak()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="8" width="5" height="16" rx="2" fill="#f5a623"/>
                  <rect x="20" y="8" width="5" height="16" rx="2" fill="#f5a623"/>
                </svg>
              </div>
              <span class="chrono-btn-label">{{ 'chrono.goBreak' | translate }}</span>
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
              <span class="chrono-btn-label">{{ 'chrono.goTraining' | translate }}</span>
            </div>
            <div class="chrono-btn" (click)="exerciseChronoUseCase.pause()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="8" width="5" height="16" rx="2" fill="#f5a623"/>
                  <rect x="20" y="8" width="5" height="16" rx="2" fill="#f5a623"/>
                </svg>
              </div>
              <span class="chrono-btn-label">{{ 'common.pause' | translate }}</span>
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
              <span class="chrono-btn-label">{{ 'common.resume' | translate }}</span>
            </div>
            <div class="chrono-btn danger" (click)="exerciseChronoUseCase.reset()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7 A9 9 0 1 0 25 16" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                  <polygon points="22,8 28,14 28,7" fill="#ef4444"/>
                </svg>
              </div>
              <span class="chrono-btn-label">{{ 'common.reset' | translate }}</span>
            </div>
            <div class="chrono-btn" (click)="exerciseChronoUseCase.goTraining()">
              <div class="chrono-btn-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="10,7 26,16 10,25" fill="#4caf50"/>
                </svg>
              </div>
              <span class="chrono-btn-label">{{ 'chrono.goTraining' | translate }}</span>
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
  private readonly translate = inject(TranslateService);

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
    if (state === 'break' || state === 'break_paused') return this.translate.instant('common.break');
    if (state === 'initial') return this.translate.instant('chrono.ready');
    return this.translate.instant('chrono.training');
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
