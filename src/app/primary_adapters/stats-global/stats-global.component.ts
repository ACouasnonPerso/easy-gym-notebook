import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed } from "@angular/core";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";
import { GetGlobalStatsUseCase } from "../../primary_ports/stats-global/get-global-stats.usecase";
import { SelectMonthUseCase } from "../../primary_ports/stats-global/select-month.usecase";
import { SelectViewTypeUseCase } from "../../primary_ports/stats-global/select-view-type.usecase";
import { MergeExercisesUseCase } from "../../primary_ports/stats-global/merge-exercises.usecase";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { formatSummaryDuration } from "../../core_logic/shared/utils";
import { StatsHeatmapCardComponent } from "./stats-heatmap-card.component";
import { StatsMuscleDonutCardComponent } from "./stats-muscle-donut-card.component";
import { StatsSummaryCardComponent } from "./stats-summary-card.component";
import { StatsTrainingTimeCardComponent } from "./stats-training-time-card.component";
import { BarChartMode } from "./training-time-bar-chart.component";
import { StatsExerciseListCardComponent, MergeSubmitEvent } from "./stats-exercise-list-card.component";
import { StatsMonthSelectorComponent } from "./stats-month-selector.component";
import { StatsImportExportCardComponent } from "./stats-import-export-card.component";

@Component({
	selector: "app-stats-global",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		StatsHeatmapCardComponent,
		StatsMuscleDonutCardComponent,
		StatsSummaryCardComponent,
		StatsTrainingTimeCardComponent,
		StatsExerciseListCardComponent,
		StatsMonthSelectorComponent,
		StatsImportExportCardComponent,
		TranslateModule,
	],
	templateUrl: "./stats-global.component.html",
	styleUrl: "./stats-global.component.scss",
})
export class StatsGlobalComponent implements OnInit, OnDestroy {
	protected readonly getGlobalStatsUseCase = inject(GetGlobalStatsUseCase);
	private readonly selectMonthUseCase = inject(SelectMonthUseCase);
	private readonly selectViewTypeUseCase = inject(SelectViewTypeUseCase);
	private readonly mergeExercisesUseCase = inject(MergeExercisesUseCase);
	private readonly router = inject(Router);
	private readonly translate = inject(TranslateService);

	readonly months = signal<
		{ label: string; value: Date | null; type: "month" | "current-year" | "total" | "current-week" }[]
	>([]);
	readonly selectedMonthIndex = signal<number>(0);
	private langChangeSub?: Subscription;

	readonly isCurrentMonth = computed(() => this.selectedMonthIndex() === 3);

	readonly weekSameAsMonth = computed(() => {
		const w = this.getGlobalStatsUseCase.weekSummary();
		const m = this.getGlobalStatsUseCase.monthSummary();
		return (
			w.totalWeightKg === m.totalWeightKg &&
			w.sessionCount === m.sessionCount &&
			w.totalDurationSeconds === m.totalDurationSeconds
		);
	});

	readonly selectedViewType = computed(() => this.months()[this.selectedMonthIndex()]?.type ?? "month");

	readonly showHeatmap = computed(() => {
		const type = this.selectedViewType();
		return type !== "current-year" && type !== "total" && type !== "current-week";
	});

	readonly barChartMode = computed((): BarChartMode => {
		const type = this.selectedViewType();
		if (type === "current-year" || type === "total") return "month";
		return "day";
	});

	readonly summaryTitle = computed((): string => {
		const type = this.selectedViewType();
		if (type === "total") return "statsGlobal.totalSummary";
		if (type === "current-year") return "statsGlobal.yearSummary";
		if (type === "current-week") return "statsGlobal.weekSummary";
		return "statsGlobal.monthSummary";
	});

	ngOnInit(): void {
		this.months.set(this.generateMonths());
		this.selectedMonthIndex.set(3);
		this.getGlobalStatsUseCase.execute();
		this.langChangeSub = this.translate.onLangChange.subscribe(() => {
			this.months.set(this.generateMonths());
		});
	}

	ngOnDestroy(): void {
		this.langChangeSub?.unsubscribe();
	}

	onMonthChange(idx: number): void {
		this.selectedMonthIndex.set(idx);
		const selected = this.months()[idx];
		if (selected.value !== null) {
			this.selectMonthUseCase.execute(selected.value);
		} else {
			this.selectViewTypeUseCase.execute(selected.type);
		}
	}

	navigateToExerciseStats(exerciseName: string): void {
		this.router.navigate(["/stats/", encodeURIComponent(exerciseName)]);
	}

	async onMergeSubmit(event: MergeSubmitEvent): Promise<void> {
		await this.mergeExercisesUseCase.execute(event.names, event.newName);
		await this.getGlobalStatsUseCase.execute();
	}

	async onDataImported(): Promise<void> {
		await this.getGlobalStatsUseCase.execute();
	}

	formatWeight(kg: number): string {
		if (kg >= 1000) return (kg / 1000).toFixed(1).replace(".", ",") + " t";
		return Math.round(kg) + " kg";
	}

	formatDuration(totalSeconds: number): string {
		return formatSummaryDuration(totalSeconds);
	}

	private generateMonths(): {
		label: string;
		value: Date | null;
		type: "month" | "current-year" | "total" | "current-week";
	}[] {
		const months: { label: string; value: Date | null; type: "month" | "current-year" | "total" | "current-week" }[] =
			[];
		months.push({ label: this.translate.instant("statsGlobal.currentYear"), value: null, type: "current-year" });
		months.push({ label: this.translate.instant("statsGlobal.total"), value: null, type: "total" });
		months.push({ label: this.translate.instant("statsGlobal.thisWeek"), value: null, type: "current-week" });
		const now = new Date();
		const locale = this.translate.currentLang;
		for (let i = 0; i < 13; i++) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const label = d.toLocaleDateString(locale, { month: "long", year: "numeric" });
			months.push({ label, value: d, type: "month" });
		}
		return months;
	}
}
