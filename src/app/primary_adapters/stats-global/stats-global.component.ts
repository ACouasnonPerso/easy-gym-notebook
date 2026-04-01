import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed, effect } from "@angular/core";
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
import { StatsYearlyHeatmapCardComponent } from "./stats-yearly-heatmap-card.component";

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
		StatsYearlyHeatmapCardComponent,
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

	private readonly currentLang = signal<string>(this.translate.currentLang ?? "fr");

	readonly durations = computed(() => {
		this.currentLang(); // tracked so re-runs on lang change
		return this.generateDurations(this.getGlobalStatsUseCase.yearsWithSessions());
	});
	readonly selectedMonthIndex = signal<number>(0);
	private langChangeSub?: Subscription;

	readonly isCurrentMonth = computed(() => {
		const selected = this.durations()[this.selectedMonthIndex()];
		if (!selected || selected.type !== "month" || selected.value === null) return false;
		const now = new Date();
		return selected.value.getFullYear() === now.getFullYear() && selected.value.getMonth() === now.getMonth();
	});

	readonly weekSameAsMonth = computed(() => {
		const w = this.getGlobalStatsUseCase.weekSummary();
		const m = this.getGlobalStatsUseCase.monthSummary();
		return (
			w.totalWeightKg === m.totalWeightKg &&
			w.sessionCount === m.sessionCount &&
			w.totalDurationSeconds === m.totalDurationSeconds
		);
	});

	readonly selectedViewType = computed(() => this.durations()[this.selectedMonthIndex()]?.type ?? "month");

	readonly showYearlyHeatmap = computed(() => {
		const type = this.selectedViewType();
		return type === "current-year" || type === "year";
	});

	readonly showHeatmap = computed(() => {
		const type = this.selectedViewType();
		return type !== "current-year" && type !== "year" && type !== "total" && type !== "current-week";
	});

	readonly barChartMode = computed((): BarChartMode => {
		const type = this.selectedViewType();
		if (type === "current-year" || type === "year" || type === "total") return "month";
		return "day";
	});

	readonly summaryTitle = computed((): string => {
		const type = this.selectedViewType();
		if (type === "total") return "statsGlobal.totalSummary";
		if (type === "current-year" || type === "year") return "statsGlobal.yearSummary";
		if (type === "current-week") return "statsGlobal.weekSummary";
		return "statsGlobal.monthSummary";
	});

	ngOnInit(): void {
		this.selectedMonthIndex.set(3);
		this.getGlobalStatsUseCase.execute();
		this.langChangeSub = this.translate.onLangChange.subscribe((event) => {
			this.currentLang.set(event.lang);
		});
	}

	ngOnDestroy(): void {
		this.langChangeSub?.unsubscribe();
	}

	onMonthChange(idx: number): void {
		this.selectedMonthIndex.set(idx);
		const selected = this.durations()[idx];
		if (selected.type === "year" && selected.value !== null) {
			// For past/future year views, set the month date first then override view type
			this.selectMonthUseCase.execute(selected.value);
			this.selectViewTypeUseCase.execute("year");
		} else if (selected.value !== null) {
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

	private generateDurations(pastYearsWithSessions: number[]): {
		label: string;
		value: Date | null;
		type: "month" | "current-year" | "year" | "total" | "current-week";
	}[] {
		const months: {
			label: string;
			value: Date | null;
			type: "month" | "current-year" | "year" | "total" | "current-week";
		}[] = [];
		const currentYear = new Date().getFullYear();
		const currentYearLabel = `${this.translate.instant("statsGlobal.currentYear")} (${currentYear})`;
		months.push({ label: currentYearLabel, value: null, type: "current-year" });
		const pastYears = pastYearsWithSessions.filter((y) => y !== currentYear).sort((a, b) => b - a);
		for (const year of pastYears) {
			months.push({
				label: this.translate.instant("statsGlobal.yearLabel", { year }),
				value: new Date(year, 0, 1),
				type: "year",
			});
		}
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
