import { Component, ChangeDetectionStrategy, input, output, signal, computed } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Session } from "../../core_logic/shared/models";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-session-header-stats",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DatePipe, TranslateModule],
	templateUrl: "./session-header-stats.component.html",
	styleUrl: "./session-header-stats.component.scss",
})
export class SessionHeaderStatsComponent {
	readonly session = input.required<Session>();
	readonly totalWeightFormatted = input.required<string>();
	readonly dateChange = output<string>();

	readonly showDateInput = signal(false);

	readonly currentDateStr = computed(() => {
		const d = this.session().date;
		return d instanceof Date ? d.toISOString().split("T")[0] : new Date(d).toISOString().split("T")[0];
	});

	onDateChange(value: string): void {
		if (!value) return;
		this.dateChange.emit(value);
	}

	protected toggleDateInput() {
		this.showDateInput.set(!this.showDateInput());
	}
}
