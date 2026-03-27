import { Component, ChangeDetectionStrategy, input, output, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgStyle } from '@angular/common';
import { MuscleGroup, PyramidSet } from '../../core_logic/shared/models';
import { AddExerciseUseCase } from '../../primary_ports/session-detail/add-exercise.usecase';
import { AutocompleteService } from '../../core_logic/session-detail/autocomplete.service';
import { MuscleGroupDetectorService } from '../../core_logic/shared/muscle-group-detector.service';
import { HapticService } from '../../core_logic/shared/haptic.service';
import { DrumPickerComponent } from '../shared/drum-picker.component';
import { generateRange } from '../../core_logic/shared/utils';
import { TranslateModule } from '@ngx-translate/core';
import { muscleGroupChipStyle } from '../../core_logic/shared/muscle-group-colors';

function secondsToMmss(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function mmssToSeconds(mmss: string): number {
  const [m, s] = mmss.split(':').map(Number);
  return m * 60 + s;
}

const WEIGHT_VALUES = [...generateRange(0, 30, 0.5), ...generateRange(31, 300, 1)];
const SETS_VALUES = generateRange(1, 20, 1);
const REPS_VALUES = generateRange(1, 50, 1);
const BREAK_VALUES = generateRange(0, 600, 5).map(secondsToMmss);
const HOURS_VALUES = generateRange(0, 12, 1);
const MINUTES_VALUES = generateRange(0, 59, 1);
const KM_VALUES: (number | string)[] = [
  '-',
  ...generateRange(0.1, 2, 0.1).map(v => Math.round(v * 10) / 10),
  ...generateRange(2.5, 50, 0.5).map(v => Math.round(v * 10) / 10),
  ...generateRange(51, 200, 1),
];

@Component({
  selector: 'app-add-exercise-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgStyle, DrumPickerComponent, TranslateModule],
  templateUrl: './add-exercise-form.component.html',
  styleUrl: './add-exercise-form.component.scss',
})
export class AddExerciseFormComponent {
  private readonly addExerciseUseCase = inject(AddExerciseUseCase);
  private readonly autocompleteService = inject(AutocompleteService);
  private readonly muscleDetector = inject(MuscleGroupDetectorService);
  private readonly haptic = inject(HapticService);

  readonly sessionId = input.required<string>();
  readonly exerciseAdded = output<void>();
  readonly cancelled = output<void>();

  readonly name = signal('');
  readonly weightKg = signal(30);
  readonly sets = signal(4);
  readonly reps = signal(10);
  readonly breakDurationSeconds = signal(60);
  readonly suggestions = signal<string[]>([]);
  readonly detectedGroups = signal<MuscleGroup[]>([]);
  readonly isCardio = signal(false);
  readonly isPyramid = signal(false);
  readonly pyramidSets = signal<PyramidSet[]>([]);

  readonly durationHours = signal(0);
  readonly durationMinutes = signal(0);
  readonly distanceKm = signal<number | null>(null);
  readonly durationSeconds = computed(() => this.durationHours() * 3600 + this.durationMinutes() * 60);

  readonly isSubmitDisabled = computed(() =>
    !this.name().trim() ||
    (this.isCardio() && this.durationSeconds() === 0) ||
    (!this.isCardio() && this.isPyramid() && this.pyramidSets().length === 0)
  );

  readonly weightValues = WEIGHT_VALUES;
  readonly setsValues = SETS_VALUES;
  readonly repsValues = REPS_VALUES;
  readonly breakValues = BREAK_VALUES;
  readonly hoursValues = HOURS_VALUES;
  readonly minutesValues = MINUTES_VALUES;
  readonly kmValues = KM_VALUES;
  readonly breakSelectedValue = computed(() => secondsToMmss(this.breakDurationSeconds()));

  tagStyle(muscle: MuscleGroup): Record<string, string> {
    return muscleGroupChipStyle(muscle);
  }

  setBreakFromMmss(v: string | number): void {
    this.breakDurationSeconds.set(mmssToSeconds(String(v)));
  }

  setDistanceKm(v: string | number | null): void {
    this.distanceKm.set(v === null ? null : +v);
  }

  async onNameInput(event: Event): Promise<void> {
    const value = (event.target as HTMLInputElement).value.slice(0, 60);
    this.name.set(value);
    const [fetchedSuggestions, detection, defaults] = await Promise.all([
      this.autocompleteService.getSuggestions(value),
      Promise.resolve(this.muscleDetector.detect(value)),
      this.autocompleteService.getDefaultsByExactName(value),
    ]);
    this.suggestions.set(fetchedSuggestions);
    this.isCardio.set(detection.isCardio);
    this.detectedGroups.set(detection.isCardio ? [] : detection.muscleGroups);
    if (!detection.isCardio && defaults) {
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
      if (lastParams.isPyramid !== undefined) this.isPyramid.set(lastParams.isPyramid);
      if (lastParams.pyramidSets !== undefined) this.pyramidSets.set(lastParams.pyramidSets);
    }
    const { muscleGroups, isCardio } = this.muscleDetector.detect(suggestion);
    this.isCardio.set(isCardio);
    this.detectedGroups.set(isCardio ? [] : muscleGroups);
  }

  togglePyramid(): void {
    const next = !this.isPyramid();
    this.isPyramid.set(next);
    if (next && this.pyramidSets().length === 0) {
      const count = this.sets();
      this.pyramidSets.set(
        Array.from({ length: count }, () => ({ weightKg: this.weightKg(), reps: this.reps() }))
      );
    }
  }

  addPyramidSet(): void {
    const last = this.pyramidSets().at(-1);
    this.pyramidSets.update(sets => [...sets, { weightKg: last?.weightKg ?? 30, reps: last?.reps ?? 10 }]);
  }

  removePyramidSet(index: number): void {
    this.pyramidSets.update(sets => sets.filter((_, i) => i !== index));
  }

  updatePyramidSet(index: number, field: 'weightKg' | 'reps', value: number): void {
    this.pyramidSets.update(sets => sets.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  async onSubmit(): Promise<void> {
    if (!this.name().trim()) return;
    if (this.isSubmitDisabled()) return;
    this.haptic.vibrate();
    await this.addExerciseUseCase.execute({
      name: this.name(),
      weightKg: this.weightKg(),
      sets: this.sets(),
      reps: this.reps(),
      breakDurationSeconds: this.breakDurationSeconds(),
      sessionId: this.sessionId(),
      isCardio: this.isCardio(),
      durationSeconds: this.durationSeconds(),
      distanceKm: this.distanceKm() ?? null,
      isPyramid: this.isPyramid(),
      pyramidSets: this.isPyramid() ? this.pyramidSets() : [],
    });
    this.exerciseAdded.emit();
  }
}
