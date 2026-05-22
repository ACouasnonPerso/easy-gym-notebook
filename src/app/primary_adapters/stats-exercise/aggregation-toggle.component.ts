import { Component, ChangeDetectionStrategy, computed, input, output, signal, DestroyRef, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { AggregationMode } from "../../core_logic/stats-exercise/group-by.model";

@Component({
	selector: "app-aggregation-toggle",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./aggregation-toggle.component.html",
	styleUrl: "./aggregation-toggle.component.scss",
})
export class AggregationToggleComponent {
	readonly value = input.required<AggregationMode>();
	readonly averageEqualsSum = input<boolean>(false);
	readonly aggregationChange = output<AggregationMode>();

	readonly showToast = signal(false);

	private readonly destroyRef = inject(DestroyRef);
	private toastTimer: ReturnType<typeof setTimeout> | null = null;

	readonly label = computed(() =>
		this.value() === "average" ? "statsExercise.aggregation.average" : "statsExercise.aggregation.sum",
	);

	toggle(): void {
		this.aggregationChange.emit(this.value() === "average" ? "sum" : "average");
		if (this.averageEqualsSum()) {
			if (this.toastTimer !== null) {
				clearTimeout(this.toastTimer);
			}
			this.showToast.set(true);
			this.toastTimer = setTimeout(() => {
				this.showToast.set(false);
				this.toastTimer = null;
			}, 2500);
			this.destroyRef.onDestroy(() => {
				if (this.toastTimer !== null) {
					clearTimeout(this.toastTimer);
				}
			});
		}
	}
}
