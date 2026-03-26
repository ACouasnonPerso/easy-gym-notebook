import { Component, ChangeDetectionStrategy, input, output, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MuscleGroup } from '../../core_logic/shared/models';
import { AddExerciseUseCase } from '../../primary_ports/session-detail/add-exercise.usecase';
import { AutocompleteService } from '../../core_logic/session-detail/autocomplete.service';
import { MuscleGroupDetectorService } from '../../core_logic/shared/muscle-group-detector.service';
import { DrumPickerComponent } from '../shared/drum-picker.component';
import { generateRange } from '../../core_logic/shared/utils';

function secondsToMmss(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function mmssToSeconds(mmss: string): number {
  const [m, s] = mmss.split(':').map(Number);
  return m * 60 + s;
}

const WEIGHT_VALUES = generateRange(0, 300, 0.5);
const SETS_VALUES = generateRange(1, 20, 1);
const REPS_VALUES = generateRange(1, 50, 1);
const BREAK_VALUES = generateRange(0, 600, 5).map(secondsToMmss);

@Component({
  selector: 'app-add-exercise-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DrumPickerComponent],
  template: `
    <div class="overlay" (click)="cancelled.emit()">
      <div class="form-card" (click)="$event.stopPropagation()">
        <h2 class="form-title">Nouvel exercice</h2>

        <div class="name-field">
          <label class="field-label">Nom</label>
          <input
            type="text"
            [value]="name()"
            (input)="onNameInput($event)"
            placeholder="ex: Développé couché"
            class="input"
          />
          @if (suggestions().length > 0) {
            <div class="suggestions">
              @for (suggestion of suggestions(); track suggestion) {
                <button type="button" class="suggestion-item" (click)="onSuggestionSelect(suggestion)">
                  {{ suggestion }}
                </button>
              }
            </div>
          }
          @if (detectedGroup()) {
            <span class="detected-group">{{ detectedGroup() }}</span>
          }
        </div>

        <div class="pickers-row">
          <div class="picker-col">
            <span class="picker-label">Poids</span>
            <app-drum-picker
              [values]="weightValues"
              [selectedValue]="weightKg()"
              unit="kg"
              (valueChange)="weightKg.set(+$event)"
            />
          </div>
          <div class="picker-col">
            <span class="picker-label">Séries</span>
            <app-drum-picker
              [values]="setsValues"
              [selectedValue]="sets()"
              (valueChange)="sets.set(+$event)"
            />
          </div>
          <div class="picker-col">
            <span class="picker-label">Répétitions</span>
            <app-drum-picker
              [values]="repsValues"
              [selectedValue]="reps()"
              (valueChange)="reps.set(+$event)"
            />
          </div>
          <div class="picker-col">
            <span class="picker-label">Repos</span>
            <app-drum-picker  style="min-width: 90px !important"
              [values]="breakValues"
              [selectedValue]="breakSelectedValue()"
              (valueChange)="setBreakFromMmss($event)"
            />
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" (click)="cancelled.emit()">Annuler</button>
          <button class="btn-submit" (click)="onSubmit()">Ajouter</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: flex-end;
      z-index: 400;
    }
    .form-card {
      background: var(--card);
      border-radius: 20px 20px 0 0;
      padding: 24px 20px calc(36px + env(safe-area-inset-bottom));
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .form-title {
      font-family: 'Syne', sans-serif;
      color: var(--text);
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 20px;
      letter-spacing: -0.3px;
    }
    .name-field {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
      position: relative;
    }
    .field-label {
      font-size: 9px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .input {
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      padding: 10px 14px;
      outline: none;
    }
    .input:focus { border-color: var(--orange); }
    .input::placeholder { color: var(--muted); }
    .suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 0 0 10px 10px;
      z-index: 10;
      display: flex;
      flex-direction: column;
    }
    .suggestion-item {
      color: var(--text);
      padding: 10px 14px;
      cursor: pointer;
      font-size: 14px;
      background: transparent;
      border: none;
      text-align: left;
      font-family: 'DM Sans', sans-serif;
    }
    .suggestion-item:hover { background: var(--card); }
    .detected-group {
      margin-top: 6px;
      display: inline-block;
      background: var(--orange-dim);
      color: var(--orange);
      font-size: 10px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid rgba(245,166,35,0.3);
      align-self: flex-start;
    }
    .pickers-row {
      display: flex;
      overflow-x: auto;
      gap: 4px;
      padding-bottom: 8px;
      scrollbar-width: none;
      background: var(--card2);
      border-radius: 14px;
      padding: 12px 8px 8px;
      border: 1px solid var(--border);
      margin-bottom: 20px;
    }
    .pickers-row::-webkit-scrollbar { display: none; }
    .picker-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 80px;
      flex: 1;
    }
    .picker-label {
      font-size: 8px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4px;
      text-align: center;
    }
    .actions { display: flex; gap: 12px; }
    .btn-cancel {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--sub);
      font-size: 13px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      cursor: pointer;
    }
    .btn-submit {
      flex: 2;
      padding: 14px;
      border-radius: 12px;
      border: none;
      background: var(--orange);
      color: #000;
      font-size: 13px;
      font-weight: 700;
      font-family: 'Syne', sans-serif;
      cursor: pointer;
    }
  `],
})
export class AddExerciseFormComponent {
  private readonly addExerciseUseCase = inject(AddExerciseUseCase);
  private readonly autocompleteService = inject(AutocompleteService);
  private readonly muscleDetector = inject(MuscleGroupDetectorService);

  readonly sessionId = input.required<string>();
  readonly exerciseAdded = output<void>();
  readonly cancelled = output<void>();

  readonly name = signal('');
  readonly weightKg = signal(30);
  readonly sets = signal(4);
  readonly reps = signal(10);
  readonly breakDurationSeconds = signal(60);
  readonly suggestions = signal<string[]>([]);
  readonly detectedGroup = signal<MuscleGroup | null>(null);

  readonly weightValues = WEIGHT_VALUES;
  readonly setsValues = SETS_VALUES;
  readonly repsValues = REPS_VALUES;
  readonly breakValues = BREAK_VALUES;
  readonly breakSelectedValue = computed(() => secondsToMmss(this.breakDurationSeconds()));

  setBreakFromMmss(v: string | number): void {
    this.breakDurationSeconds.set(mmssToSeconds(String(v)));
  }

  async onNameInput(event: Event): Promise<void> {
    const value = (event.target as HTMLInputElement).value;
    this.name.set(value);
    const [fetchedSuggestions, detection, defaults] = await Promise.all([
      this.autocompleteService.getSuggestions(value),
      Promise.resolve(this.muscleDetector.detect(value)),
      this.autocompleteService.getDefaultsByExactName(value),
    ]);
    this.suggestions.set(fetchedSuggestions);
    this.detectedGroup.set(detection.muscleGroups[0] ?? null);
    if (defaults) {
      if (defaults.weightKg !== undefined) this.weightKg.set(defaults.weightKg);
      if (defaults.sets !== undefined) this.sets.set(defaults.sets);
      if (defaults.reps !== undefined) this.reps.set(defaults.reps);
      if (defaults.breakDurationSeconds !== undefined) this.breakDurationSeconds.set(defaults.breakDurationSeconds);
    }
  }

  async onSuggestionSelect(suggestion: string): Promise<void> {
    this.name.set(suggestion);
    this.suggestions.set([]);
    const lastParams = await this.autocompleteService.getLastParams(suggestion);
    if (lastParams) {
      if (lastParams.weightKg !== undefined) this.weightKg.set(lastParams.weightKg);
      if (lastParams.sets !== undefined) this.sets.set(lastParams.sets);
      if (lastParams.reps !== undefined) this.reps.set(lastParams.reps);
      if (lastParams.breakDurationSeconds !== undefined) this.breakDurationSeconds.set(lastParams.breakDurationSeconds);
    }
    const { muscleGroups } = this.muscleDetector.detect(suggestion);
    this.detectedGroup.set(muscleGroups[0] ?? null);
  }

  async onSubmit(): Promise<void> {
    if (!this.name().trim()) return;
    await this.addExerciseUseCase.execute({
      name: this.name(),
      weightKg: this.weightKg(),
      sets: this.sets(),
      reps: this.reps(),
      breakDurationSeconds: this.breakDurationSeconds(),
      sessionId: this.sessionId(),
    });
    this.exerciseAdded.emit();
  }
}
