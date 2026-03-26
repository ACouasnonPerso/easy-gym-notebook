import { Injectable, inject, signal, computed } from '@angular/core';
import { Session, Exercise, MuscleGroup } from '../shared/models';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';

export interface HeatmapCell {
  date: Date;
  hasSession: boolean;
  isCurrentMonth: boolean;
  tags: string[];
}

export interface MonthSummary {
  totalWeightKg: number;
  sessionCount: number;
  totalDurationSeconds: number;
}

export interface WeeklyAverage {
  avgWeightKg: number;
  sessionsPerWeek: number;
  avgDurationSeconds: number;
}

export interface ExerciseSummary {
  name: string;
  maxWeightKg: number;
  totalVolumeKg: number;
  occurrenceCount: number;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSundayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly sessionRepo = inject(SESSION_REPOSITORY);
  private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

  readonly _allSessions = signal<Session[]>([]);
  readonly _allExercises = signal<Exercise[]>([]);
  readonly selectedMonth = signal<Date>(new Date());

  async load(): Promise<void> {
    const [sessions, exercises] = await Promise.all([
      this.sessionRepo.getAll(),
      this.exerciseRepo.getAll(),
    ]);
    this._allSessions.set(sessions);
    this._allExercises.set(exercises);
  }

  setMonth(month: Date): void {
    this.selectedMonth.set(month);
  }

  private readonly _sessionsInMonth = computed(() => {
    const m = this.selectedMonth();
    return this._allSessions().filter(
      s => s.date.getFullYear() === m.getFullYear() && s.date.getMonth() === m.getMonth()
    );
  });

  private readonly _exercisesInMonth = computed(() => {
    const sessionIds = new Set(this._sessionsInMonth().map(s => s.id));
    return this._allExercises().filter(e => sessionIds.has(e.sessionId) && e.status === 'validated');
  });

  readonly heatmapData = computed((): HeatmapCell[] => {
    const selected = this.selectedMonth();
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const gridStart = getMondayOfWeek(firstDay);
    const gridEnd = getSundayOfWeek(lastDay);

    const sessionTagsByDate = new Map<string, string[]>();
    for (const s of this._allSessions()) {
      const key = `${s.date.getFullYear()}-${s.date.getMonth()}-${s.date.getDate()}`;
      if (!sessionTagsByDate.has(key)) sessionTagsByDate.set(key, []);
      if (s.muscleGroup !== null && !sessionTagsByDate.get(key)!.includes(s.muscleGroup)) {
        sessionTagsByDate.get(key)!.push(s.muscleGroup);
      }
    }

    const cells: HeatmapCell[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      cells.push({
        date: new Date(cursor),
        hasSession: sessionTagsByDate.has(key),
        isCurrentMonth: cursor.getMonth() === month && cursor.getFullYear() === year,
        tags: sessionTagsByDate.get(key) ?? [],
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  });

  readonly monthSummary = computed((): MonthSummary => {
    const exercises = this._exercisesInMonth();
    const sessions = this._sessionsInMonth();
    const totalWeightKg = exercises.reduce((sum, e) => sum + e.weightKg * e.sets * e.reps, 0);
    const sessionCount = sessions.length;
    const totalDurationSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    return { totalWeightKg, sessionCount, totalDurationSeconds };
  });

  readonly weeklyAverage = computed((): WeeklyAverage => {
    const selected = this.selectedMonth();
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = Math.ceil(daysInMonth / 7);
    const { totalWeightKg, sessionCount, totalDurationSeconds } = this.monthSummary();
    return {
      avgWeightKg: totalWeightKg / weeks,
      sessionsPerWeek: sessionCount / weeks,
      avgDurationSeconds: totalDurationSeconds / weeks,
    };
  });

  readonly muscleGroupDistribution = computed((): Map<MuscleGroup, number> => {
    const exercises = this._exercisesInMonth();
    if (exercises.length === 0) return new Map();

    const counts = new Map<MuscleGroup, number>();
    for (const e of exercises) {
      if (e.muscleGroup === null) continue;
      counts.set(e.muscleGroup, (counts.get(e.muscleGroup) ?? 0) + 1);
    }
    if (counts.size === 0) return new Map();

    const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
    const percentages = new Map<MuscleGroup, number>();
    for (const [group, count] of counts)
      percentages.set(group, Math.round((count / total) * 100));

    return percentages;
  });

  readonly weekSummary = computed((): MonthSummary => {
    const today = new Date();
    const weekStart = getMondayOfWeek(today);
    const weekEnd = getSundayOfWeek(today);

    const sessionsInWeek = this._allSessions().filter(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d >= weekStart && d <= weekEnd;
    });

    const sessionIds = new Set(sessionsInWeek.map(s => s.id));
    const exercisesInWeek = this._allExercises().filter(
      e => sessionIds.has(e.sessionId) && e.status === 'validated'
    );

    const totalWeightKg = exercisesInWeek.reduce((sum, e) => sum + e.weightKg * e.sets * e.reps, 0);
    const sessionCount = sessionsInWeek.length;
    const totalDurationSeconds = sessionsInWeek.reduce((sum, s) => sum + s.durationSeconds, 0);

    return { totalWeightKg, sessionCount, totalDurationSeconds };
  });

  readonly exerciseSummaries = computed((): ExerciseSummary[] => {
    const exercises = this._exercisesInMonth();
    const byName = new Map<string, Exercise[]>();
    for (const e of exercises) {
      const group = byName.get(e.name) ?? [];
      group.push(e);
      byName.set(e.name, group);
    }

    const summaries: ExerciseSummary[] = [];
    for (const [name, group] of byName) {
      const maxWeightKg = Math.max(...group.map(e => e.weightKg));
      const totalVolumeKg = group.reduce((sum, e) => sum + e.weightKg * e.sets * e.reps, 0);
      summaries.push({ name, maxWeightKg, totalVolumeKg, occurrenceCount: group.length });
    }

    return summaries.sort((a, b) => b.totalVolumeKg - a.totalVolumeKg);
  });
}
