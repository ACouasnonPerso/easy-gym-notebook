import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe, NgStyle } from '@angular/common';
import { Session, MuscleGroup } from '../../core_logic/shared/models';
import { formatDuration } from '../../core_logic/shared/utils';
import { LongPressDirective } from '../shared/long-press.directive';

@Component({
  selector: 'app-session-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LongPressDirective, NgStyle],
  template: `
    <div class="session-card" appLongPress (longPress)="longPress.emit()">
      <div class="session-header">
        <span class="session-date">{{ session().date | date:'EEE d MMM yyyy' }}</span>
        <div class="tag-list">
          @for (muscle of visibleTags(); track muscle) {
            <span class="muscle-tag" [ngStyle]="tagStyle(muscle)">{{ muscle }}</span>
          }
          @if (extraTagCount() > 0) {
            <span class="muscle-tag extra-tag">+{{ extraTagCount() }}</span>
          }
        </div>
      </div>
      <div class="session-stats">
        <div class="stat-item">
          <span class="stat-value orange">{{ totalWeightFormatted() }}</span>
          <span class="stat-label">Poids</span>
        </div>
        <div class="stat-item">
          <span class="stat-value blue">{{ exerciseCount() }}</span>
          <span class="stat-label">Exercices</span>
        </div>
        <div class="stat-item right">
          <span class="stat-value">{{ duration() }}</span>
          <span class="stat-label">Temps</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-card {
      background: var(--card);
      border-radius: 18px;
      padding: 16px;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: transform 0.18s, border-color 0.18s;
      position: relative;
      overflow: hidden;
      user-select: none;
    }
    .session-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: var(--orange);
      border-radius: 3px 0 0 3px;
    }
    .session-card:hover {
      transform: translateY(-2px);
      border-color: var(--orange);
    }
    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      margin-bottom: 12px;
      gap: 6px;
    }
    .session-date {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--orange);
      letter-spacing: 0.2px;
      flex-shrink: 0;
    }
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }
    .muscle-tag {
      font-size: 9px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 3px 7px;
      border-radius: 20px;
    }
    .extra-tag {
      background: var(--card2);
      color: var(--sub);
      border: 1px solid var(--border);
    }
    .session-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stat-item.right { text-align: right; }
    .stat-value {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 17px;
      font-weight: 600;
      color: var(--sub);
    }
    .stat-value.orange { color: var(--orange); }
    .stat-value.blue { color: var(--blue); }
    .stat-label {
      font-size: 9px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }
  `],
})
export class SessionCardComponent {
  readonly session = input.required<Session>();
  readonly longPress = output<void>();

  readonly exerciseCount = computed(() => this.session().exercises.length);

  readonly totalWeight = computed(() =>
    this.session()
      .exercises.filter(e => e.status === 'validated')
      .reduce((sum, e) => sum + e.weightKg * e.sets * e.reps, 0)
  );

  readonly duration = computed(() => formatDuration(this.session().durationSeconds));

  readonly totalWeightFormatted = computed(() => {
    const kg = this.totalWeight();
    if (kg >= 1000) return (kg / 1000).toFixed(1).replace('.', ',') + ' t';
    return kg + ' kg';
  });

  readonly muscleTags = computed((): MuscleGroup[] => {
    const seen = new Set<MuscleGroup>();
    const result: MuscleGroup[] = [];
    for (const exercise of this.session().exercises) {
      if (exercise.muscleGroup !== null && !seen.has(exercise.muscleGroup)) {
        seen.add(exercise.muscleGroup);
        result.push(exercise.muscleGroup);
        if (result.length === 5) break;
      }
    }
    if (result.length === 0 && this.session().muscleGroup !== null)
      result.push(this.session().muscleGroup as MuscleGroup);
    return result;
  });

  readonly visibleTags = computed(() => this.muscleTags().slice(0, 2));

  readonly extraTagCount = computed(() => Math.max(0, this.muscleTags().length - 2));

  private readonly muscleColorMap: Record<MuscleGroup, { color: string; bg: string; border: string }> = {
    [MuscleGroup.Chest]:      { color: '#e74c3c', bg: 'rgba(231,76,60,0.15)',    border: 'rgba(231,76,60,0.3)' },
    [MuscleGroup.Back]:       { color: '#3498db', bg: 'rgba(52,152,219,0.15)',   border: 'rgba(52,152,219,0.3)' },
    [MuscleGroup.Shoulders]:  { color: '#9b59b6', bg: 'rgba(155,89,182,0.15)',   border: 'rgba(155,89,182,0.3)' },
    [MuscleGroup.Biceps]:     { color: '#2ecc71', bg: 'rgba(46,204,113,0.15)',   border: 'rgba(46,204,113,0.3)' },
    [MuscleGroup.Triceps]:    { color: '#1abc9c', bg: 'rgba(26,188,156,0.15)',   border: 'rgba(26,188,156,0.3)' },
    [MuscleGroup.Forearms]:   { color: '#a3cb38', bg: 'rgba(163,203,56,0.15)',   border: 'rgba(163,203,56,0.3)' },
    [MuscleGroup.Abs]:        { color: 'var(--orange)', bg: 'var(--orange-dim)', border: 'rgba(245,166,35,0.3)' },
    [MuscleGroup.Quads]:      { color: '#00bcd4', bg: 'rgba(0,188,212,0.15)',    border: 'rgba(0,188,212,0.3)' },
    [MuscleGroup.Hamstrings]: { color: '#5c6bc0', bg: 'rgba(92,107,192,0.15)',   border: 'rgba(92,107,192,0.3)' },
    [MuscleGroup.Glutes]:     { color: '#e91e8c', bg: 'rgba(233,30,140,0.15)',   border: 'rgba(233,30,140,0.3)' },
    [MuscleGroup.Calves]:     { color: '#f1c40f', bg: 'rgba(241,196,15,0.15)',   border: 'rgba(241,196,15,0.3)' },
    [MuscleGroup.Traps]:      { color: '#ff9800', bg: 'rgba(255,152,0,0.15)',    border: 'rgba(255,152,0,0.3)' },
    [MuscleGroup.FullBody]:   { color: '#ecf0f1', bg: 'rgba(236,240,241,0.1)',   border: 'rgba(236,240,241,0.2)' },
  };

  tagStyle(muscle: string): Record<string, string> {
    const entry = this.muscleColorMap[muscle as MuscleGroup];
    if (!entry) return {};
    return { color: entry.color, background: entry.bg, border: `1px solid ${entry.border}` };
  }
}
