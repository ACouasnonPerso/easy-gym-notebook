import { Component, ChangeDetectionStrategy, input, output, signal, computed } from "@angular/core";
import { NgStyle } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { ExerciseSummaryRowComponent } from "./exercise-summary-row.component";
import { ExerciseSummary } from "../../core_logic/stats-global/stats.service";
import { MuscleGroup } from "../../core_logic/shared/models";
import { muscleGroupChipStyle } from "../../core_logic/shared/muscle-group-colors";

export interface MergeSubmitEvent {
	names: string[];
	newName: string;
}

@Component({
	selector: "app-stats-exercise-list-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ExerciseSummaryRowComponent, TranslateModule, NgStyle],
	templateUrl: "./stats-exercise-list-card.component.html",
	styleUrl: "./stats-global.component.scss",
})
export class StatsExerciseListCardComponent {
	exercises = input<ExerciseSummary[]>([]);

	exerciseSelected = output<string>();
	mergeSubmit = output<MergeSubmitEvent>();

	readonly isMergeMode = signal(false);
	readonly mergeSelectedNames = signal<Set<string>>(new Set());
	readonly mergeNewName = signal("");
	readonly showMergeConfirm = signal(false);

	readonly selectedTags = signal<Set<MuscleGroup | "cardio">>(new Set());

	readonly availableTags = computed((): MuscleGroup[] => {
		const seen = new Set<MuscleGroup>();
		for (const exercise of this.exercises()) {
			for (const mg of exercise.muscleGroups ?? []) {
				seen.add(mg);
			}
		}
		return Array.from(seen);
	});

	readonly hasCardio = computed((): boolean => this.exercises().some((e) => e.isCardio));

	readonly filteredExercises = computed((): ExerciseSummary[] => {
		const selected = this.selectedTags();
		if (selected.size === 0) return this.exercises();
		const muscleGroupSelected = new Set<MuscleGroup>(
			[...selected].filter((t): t is MuscleGroup => t !== "cardio") as MuscleGroup[]
		);
		const cardioSelected = selected.has("cardio");
		return this.exercises().filter((e) => {
			if (cardioSelected && e.isCardio) return true;
			return (e.muscleGroups ?? []).some((mg) => muscleGroupSelected.has(mg));
		});
	});

	readonly mergeSelectionIsCardio = computed<boolean | null>(() => {
		const selected = this.mergeSelectedNames();
		if (selected.size === 0) return null;
		const firstName = selected.values().next().value!;
		return this.exercises().find((e) => e.name === firstName)?.isCardio ?? null;
	});

	tagChipStyle(tag: MuscleGroup | "cardio"): Record<string, string> {
		if (tag === "cardio") {
			return {
				color: "#3498db",
				background: "rgba(52,152,219,0.15)",
				border: "1px solid rgba(52,152,219,0.3)",
			};
		}
		return muscleGroupChipStyle(tag);
	}

	toggleTagFilter(tag: MuscleGroup | "cardio"): void {
		const current = new Set(this.selectedTags());
		if (current.has(tag)) {
			current.delete(tag);
		} else {
			current.add(tag);
		}
		this.selectedTags.set(current);
	}

	toggleMergeMode(): void {
		const next = !this.isMergeMode();
		this.isMergeMode.set(next);
		if (!next) {
			this.mergeSelectedNames.set(new Set());
			this.mergeNewName.set("");
			this.showMergeConfirm.set(false);
		}
	}

	toggleMergeSelection(name: string): void {
		const current = new Set(this.mergeSelectedNames());
		if (current.has(name)) {
			current.delete(name);
		} else {
			const selectionIsCardio = this.mergeSelectionIsCardio();
			const exerciseIsCardio = this.exercises().find((e) => e.name === name)?.isCardio ?? false;
			if (selectionIsCardio !== null && selectionIsCardio !== exerciseIsCardio) return;
			if (current.size === 0) this.mergeNewName.set(name);
			current.add(name);
		}
		this.mergeSelectedNames.set(current);
	}

	onMergeSubmit(): void {
		if (this.mergeSelectedNames().size < 2 || !this.mergeNewName().trim()) return;
		this.showMergeConfirm.set(true);
	}

	onMergeConfirm(): void {
		this.mergeSubmit.emit({
			names: Array.from(this.mergeSelectedNames()),
			newName: this.mergeNewName().trim(),
		});
		this.showMergeConfirm.set(false);
		this.isMergeMode.set(false);
		this.mergeSelectedNames.set(new Set());
		this.mergeNewName.set("");
	}
}
