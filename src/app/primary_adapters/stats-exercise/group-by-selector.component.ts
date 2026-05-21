import { Component, ChangeDetectionStrategy, input, output, signal, computed } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";

interface GroupByOption {
	value: GroupBy;
	labelKey: string;
}

@Component({
	selector: "app-group-by-selector",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./group-by-selector.component.html",
	styleUrl: "./group-by-selector.component.scss",
})
export class GroupBySelectorComponent {
	readonly selected = input.required<GroupBy>();
	readonly groupByChange = output<GroupBy>();
	readonly showDropdown = signal(false);

	readonly options: GroupByOption[] = [
		{ value: "session", labelKey: "statsExercise.groupBy.session" },
		{ value: "week", labelKey: "statsExercise.groupBy.week" },
		{ value: "month", labelKey: "statsExercise.groupBy.month" },
		{ value: "year", labelKey: "statsExercise.groupBy.year" },
	];

	readonly currentLabel = computed(() => {
		const current = this.options.find((o) => o.value === this.selected());
		return current?.labelKey ?? "";
	});

	selectOption(value: GroupBy): void {
		this.groupByChange.emit(value);
		this.showDropdown.set(false);
	}
}
