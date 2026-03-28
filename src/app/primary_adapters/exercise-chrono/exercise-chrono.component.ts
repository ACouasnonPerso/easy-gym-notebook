import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ExerciseChronoUseCase } from '../../primary_ports/exercise-chrono/exercise-chrono.usecase';
import { EditDurationPopupComponent } from '../session-detail/edit-duration-popup.component';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import { HapticService } from '../../core_logic/shared/haptic.service';
import { ChronoHeaderComponent } from './chrono-header.component';
import { ChronoRingComponent } from './chrono-ring.component';
import { ChronoActionsComponent } from './chrono-actions.component';

@Component({
  selector: 'app-exercise-chrono',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [EditDurationPopupComponent, ChronoHeaderComponent, ChronoRingComponent, ChronoActionsComponent],
  templateUrl: './exercise-chrono.component.html',
  styleUrl: './exercise-chrono.component.scss',
})
export class ExerciseChronoComponent implements OnInit {
  protected readonly exerciseChronoUseCase = inject(ExerciseChronoUseCase);
  private readonly route = inject(ActivatedRoute);
  protected readonly location = inject(Location);
  private readonly translate = inject(TranslateService);
  protected readonly haptic = inject(HapticService);

  readonly _breakDuration = signal(120);
  readonly hasExercise = signal(false);
  readonly showBreakDurationPopup = signal(false);

  readonly circumference = 2 * Math.PI * 90;

  readonly chronoState = this.exerciseChronoUseCase.chronoState;
  readonly seriesCount = this.exerciseChronoUseCase.seriesCount;
  readonly soundEnabled = this.exerciseChronoUseCase.soundEnabled;

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
