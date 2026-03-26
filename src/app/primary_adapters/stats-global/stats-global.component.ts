import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GetGlobalStatsUseCase } from '../../primary_ports/stats-global/get-global-stats.usecase';
import { SelectMonthUseCase } from '../../primary_ports/stats-global/select-month.usecase';
import { MergeExercisesUseCase } from '../../primary_ports/stats-global/merge-exercises.usecase';
import { HeatmapComponent } from './heatmap.component';
import { DonutChartComponent } from './donut-chart.component';
import { ExerciseSummaryRowComponent } from './exercise-summary-row.component';

@Component({
  selector: 'app-stats-global',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeatmapComponent, DonutChartComponent, ExerciseSummaryRowComponent, FormsModule],
  template: `
    <div class="page">

      <!-- Month selector -->
      <div class="month-selector">
        <div class="month-select-wrapper" (click)="showDropdown.set(!showDropdown())">
          <span class="month-label">{{ currentMonthLabel() }}</span>
          <span class="month-arrow" [class.open]="showDropdown()">▼</span>
        </div>
        @if (showDropdown()) {
          <div class="dropdown-backdrop" (click)="showDropdown.set(false)"></div>
          <div class="dropdown-list">
            @for (month of months(); track month.label; let i = $index) {
              <div
                class="dropdown-item"
                [class.selected]="i === selectedMonthIndex()"
                (click)="onMonthChange(i); showDropdown.set(false)"
              >{{ month.label }}</div>
            }
          </div>
        }
      </div>

      <!-- Heatmap -->
      @if (showHeatmap()) {
        <div class="stats-card">
          <div class="stats-card-title">Training recurrences</div>
          <app-heatmap [data]="getGlobalStatsUseCase.heatmapData()" />
        </div>
      }

      <!-- Worked muscles -->
      <div class="stats-card">
        <div class="stats-card-title">Worked muscles</div>
        <app-donut-chart [distribution]="getGlobalStatsUseCase.muscleGroupDistribution()" />
      </div>

      <!-- Résumé de la semaine -->
      @if (isCurrentMonth()) {
        <div class="stats-card">
          <div class="stats-card-title">Résumé de la semaine</div>
          <div class="divider"></div>
          <div style="height:12px"></div>
          <div class="summary-grid">
            <div class="summary-stat">
              <span class="summary-value" style="color:var(--orange)">{{ formatWeight(getGlobalStatsUseCase.weekSummary().totalWeightKg) }}</span>
              <span class="summary-label">Poids</span>
            </div>
            <div class="summary-stat" style="text-align:center">
              <span class="summary-value" style="color:var(--green)">{{ getGlobalStatsUseCase.weekSummary().sessionCount }}</span>
              <span class="summary-label">Sessions</span>
            </div>
            <div class="summary-stat" style="text-align:right">
              <span class="summary-value">{{ formatDuration(getGlobalStatsUseCase.weekSummary().totalDurationSeconds) }}</span>
              <span class="summary-label">Temps</span>
            </div>
          </div>
        </div>
      }

      <!-- Résumé du mois -->
      <div class="stats-card">
        <div class="stats-card-title">Résumé du mois</div>
        <div class="divider"></div>
        <div style="height:12px"></div>
        <div class="summary-grid">
          <div class="summary-stat">
            <span class="summary-value" style="color:var(--orange)">{{ formatWeight(getGlobalStatsUseCase.monthSummary().totalWeightKg) }}</span>
            <span class="summary-label">Poids</span>
          </div>
          <div class="summary-stat" style="text-align:center">
            <span class="summary-value" style="color:var(--green)">{{ getGlobalStatsUseCase.monthSummary().sessionCount }}</span>
            <span class="summary-label">Sessions</span>
          </div>
          <div class="summary-stat" style="text-align:right">
            <span class="summary-value">{{ formatDuration(getGlobalStatsUseCase.monthSummary().totalDurationSeconds) }}</span>
            <span class="summary-label">Temps</span>
          </div>
        </div>
      </div>

      <!-- Exercices -->
      @if (getGlobalStatsUseCase.exerciseSummaries().length > 0) {
        <div class="stats-card">
          <div class="exercise-card-header">
            <div class="stats-card-title" style="margin-bottom:0">Exercices</div>
            <button
              data-testid="merge-btn"
              class="merge-btn"
              [class.active]="isMergeMode()"
              (click)="toggleMergeMode()"
            >Merge</button>
          </div>

          @if (isMergeMode()) {
            <div class="merge-controls">
              <input
                data-testid="merge-name-input"
                class="merge-name-input"
                type="text"
                placeholder="Nouveau nom..."
                [value]="mergeNewName()"
                (input)="mergeNewName.set($any($event.target).value)"
              />
              <button
                data-testid="merge-submit-btn"
                class="merge-submit-btn"
                [disabled]="mergeSelectedNames().size < 2 || !mergeNewName().trim()"
                (click)="onMergeSubmit()"
              >Fusionner {{ mergeSelectedNames().size }} exercice(s)</button>
            </div>
          }

          <div class="exercise-list" [style.margin-top]="isMergeMode() ? '12px' : '0'">
            @for (exercise of getGlobalStatsUseCase.exerciseSummaries(); track exercise.name) {
              @if (isMergeMode()) {
                <div
                  class="exercise-merge-row"
                  [class.selected]="mergeSelectedNames().has(exercise.name)"
                  (click)="toggleMergeSelection(exercise.name)"
                >
                  <span data-testid="exercise-merge-checkbox" class="merge-checkbox" [class.checked]="mergeSelectedNames().has(exercise.name)">
                    @if (mergeSelectedNames().has(exercise.name)) { ✓ }
                  </span>
                  <span class="merge-exercise-name">{{ exercise.name }}</span>
                </div>
              } @else {
                <app-exercise-summary-row
                  [exerciseName]="exercise.name"
                  [maxWeightKg]="exercise.maxWeightKg"
                  [totalVolumeKg]="exercise.totalVolumeKg"
                  [occurrenceCount]="exercise.occurrenceCount"
                  (selected)="navigateToExerciseStats($event)"
                />
              }
            }
          </div>
        </div>
      }

      <!-- Confirmation popup -->
      @if (showMergeConfirm()) {
        <div class="popup-backdrop" (click)="showMergeConfirm.set(false)">
          <div data-testid="merge-confirm-popup" class="popup" (click)="$event.stopPropagation()">
            <div class="popup-title">Confirmer le merge</div>
            <p class="popup-body">
              Renommer <strong>{{ mergeSelectedNames().size }}</strong> exercice(s) en
              <strong>« {{ mergeNewName() }} »</strong> ?<br>
              Cette action est irréversible.
            </p>
            <div class="popup-actions">
              <button class="popup-cancel-btn" (click)="showMergeConfirm.set(false)">Annuler</button>
              <button data-testid="merge-confirm-ok-btn" class="popup-ok-btn" (click)="onMergeConfirm()">Confirmer</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page {
      background: var(--bg);
      min-height: 100vh;
      padding: 20px 16px 100px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 720px;
      margin: 0 auto;
      width: 100%;
    }
    @media (min-width: 640px) {
      .page {
        padding: 28px 24px 100px;
        gap: 16px;
      }
    }
    @media (min-width: 1024px) {
      .page {
        padding: 40px 32px 120px;
      }
    }
    .month-selector {
      display: flex;
      justify-content: flex-end;
      position: relative;
    }
    .month-select-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      user-select: none;
    }
    .month-label {
      font-family: 'Syne', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
    }
    .month-arrow {
      font-size: 9px;
      color: var(--orange);
      transition: transform 0.2s;
    }
    .month-arrow.open {
      transform: rotate(180deg);
    }
    .dropdown-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99;
    }
    .dropdown-list {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 100;
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 180px;
      max-height: 260px;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      scrollbar-width: none;
    }
    .dropdown-list::-webkit-scrollbar { display: none; }
    .dropdown-item {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: var(--sub);
      padding: 9px 14px;
      border-radius: 9px;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
      text-transform: capitalize;
    }
    .dropdown-item:hover {
      background: var(--card);
      color: var(--text);
    }
    .dropdown-item.selected {
      color: var(--orange);
      background: var(--orange-dim);
    }
    .stats-card {
      background: var(--card);
      border-radius: 18px;
      padding: 14px;
      border: 1px solid var(--border);
    }
    @media (min-width: 640px) {
      .stats-card {
        padding: 18px;
      }
    }
    .stats-card-title {
      font-family: 'Syne', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 14px;
      letter-spacing: -0.2px;
    }
    .divider { height: 1px; background: var(--border); }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
    .summary-stat { display: flex; flex-direction: column; gap: 3px; }
    .summary-value {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
    }
    @media (min-width: 640px) {
      .summary-value {
        font-size: 19px;
      }
    }
    .summary-label {
      font-size: 9px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }
    .exercise-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    /* Merge feature */
    .exercise-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .merge-btn {
      font-family: 'Syne', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--sub);
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 5px 12px;
      cursor: pointer;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
    }
    .merge-btn.active, .merge-btn:hover {
      color: var(--orange);
      border-color: var(--orange);
      background: var(--orange-dim);
    }
    .merge-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 4px;
    }
    .merge-name-input {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 14px;
      outline: none;
      transition: border-color 0.15s;
    }
    .merge-name-input:focus { border-color: var(--orange); }
    .merge-name-input::placeholder { color: var(--muted); }
    .merge-submit-btn {
      font-family: 'Syne', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: var(--bg);
      background: var(--orange);
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .merge-submit-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .exercise-merge-row {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--card2);
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .exercise-merge-row.selected { border-color: var(--orange); }
    .merge-checkbox {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      border: 1.5px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: var(--orange);
      background: var(--card);
      flex-shrink: 0;
      transition: border-color 0.12s, background 0.12s;
    }
    .merge-checkbox.checked {
      border-color: var(--orange);
      background: var(--orange-dim);
    }
    .merge-exercise-name {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
    }
    /* Confirmation popup */
    .popup-backdrop {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 20px;
    }
    .popup {
      background: var(--card);
      border-radius: 20px;
      padding: 24px 20px 20px;
      border: 1px solid var(--border);
      width: 100%;
      max-width: 420px;
      box-shadow: 0 -4px 40px rgba(0,0,0,0.4);
    }
    .popup-title {
      font-family: 'Syne', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 10px;
    }
    .popup-body {
      font-size: 13px;
      color: var(--sub);
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .popup-body strong { color: var(--text); }
    .popup-actions {
      display: flex;
      gap: 10px;
    }
    .popup-cancel-btn {
      flex: 1;
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--sub);
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
    }
    .popup-ok-btn {
      flex: 1;
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--bg);
      background: var(--orange);
      border: none;
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
    }
  `],
})
export class StatsGlobalComponent implements OnInit {
  protected readonly getGlobalStatsUseCase = inject(GetGlobalStatsUseCase);
  private readonly selectMonthUseCase = inject(SelectMonthUseCase);
  private readonly mergeExercisesUseCase = inject(MergeExercisesUseCase);
  private readonly router = inject(Router);

  readonly months = signal<{ label: string; value: Date | null; type: 'month' | 'current-year' | 'total' }[]>([]);
  readonly selectedMonthIndex = signal<number>(0);
  readonly showDropdown = signal(false);

  // Merge feature state
  readonly isMergeMode = signal(false);
  readonly mergeSelectedNames = signal<Set<string>>(new Set());
  readonly mergeNewName = signal('');
  readonly showMergeConfirm = signal(false);

  readonly currentMonthLabel = computed(() => this.months()[this.selectedMonthIndex()]?.label ?? '');

  readonly isCurrentMonth = computed(() => this.selectedMonthIndex() === 2);

  readonly selectedViewType = computed(() => this.months()[this.selectedMonthIndex()]?.type ?? 'month');

  readonly showHeatmap = computed(() => {
    const type = this.selectedViewType();
    return type !== 'current-year' && type !== 'total';
  });

  ngOnInit(): void {
    this.months.set(this.generateMonths());
    this.selectedMonthIndex.set(2);
    this.getGlobalStatsUseCase.execute();
  }

  onMonthChange(idx: number): void {
    this.selectedMonthIndex.set(idx);
    const value = this.months()[idx].value;
    if (value !== null) {
      this.selectMonthUseCase.execute(value);
    }
  }

  toggleMergeMode(): void {
    const next = !this.isMergeMode();
    this.isMergeMode.set(next);
    if (!next) {
      this.mergeSelectedNames.set(new Set());
      this.mergeNewName.set('');
      this.showMergeConfirm.set(false);
    }
  }

  toggleMergeSelection(name: string): void {
    const current = new Set(this.mergeSelectedNames());
    if (current.has(name)) {
      current.delete(name);
    } else {
      if (current.size === 0) {
        this.mergeNewName.set(name);
      }
      current.add(name);
    }
    this.mergeSelectedNames.set(current);
  }

  onMergeSubmit(): void {
    if (this.mergeSelectedNames().size < 2 || !this.mergeNewName().trim()) return;
    this.showMergeConfirm.set(true);
  }

  async onMergeConfirm(): Promise<void> {
    const names = Array.from(this.mergeSelectedNames());
    const newName = this.mergeNewName().trim();
    await this.mergeExercisesUseCase.execute(names, newName);
    this.showMergeConfirm.set(false);
    this.isMergeMode.set(false);
    this.mergeSelectedNames.set(new Set());
    this.mergeNewName.set('');
    await this.getGlobalStatsUseCase.execute();
  }

  navigateToExerciseStats(exerciseName: string): void {
    this.router.navigate(['/stats/', encodeURIComponent(exerciseName)]);
  }

  formatWeight(kg: number): string {
    if (kg >= 1000) return (kg / 1000).toFixed(1).replace('.', ',') + ' t';
    return Math.round(kg) + ' kg';
  }

  formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h${minutes}`;
    return `${minutes}min`;
  }

  private generateMonths(): { label: string; value: Date | null; type: 'month' | 'current-year' | 'total' }[] {
    const months: { label: string; value: Date | null; type: 'month' | 'current-year' | 'total' }[] = [];
    months.push({ label: 'Année en cours', value: null, type: 'current-year' });
    months.push({ label: 'Total', value: null, type: 'total' });
    const now = new Date();
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      months.push({ label, value: d, type: 'month' });
    }
    return months;
  }
}
