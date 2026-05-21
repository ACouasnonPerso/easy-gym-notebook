import { Component, ChangeDetectionStrategy, input, computed, inject, InjectionToken } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { HighlightViewModel } from "../../core_logic/stats-global/highlight-metric.model";
import { MUSCLE_GROUP_COLORS } from "../../core_logic/shared/muscle-group-colors";

const DEFAULT_PALETTE = Object.values(MUSCLE_GROUP_COLORS).map((c) => c.color);

export const HIGHLIGHTS_PALETTE = new InjectionToken<string[]>("HIGHLIGHTS_PALETTE", {
	providedIn: "root",
	factory: () => DEFAULT_PALETTE,
});

@Component({
	selector: "app-stats-highlights-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [CommonModule, TranslateModule],
	templateUrl: "./stats-highlights-card.component.html",
	styleUrl: "./stats-highlights-card.component.scss",
})
export class StatsHighlightsCardComponent {
	private readonly palette = inject(HIGHLIGHTS_PALETTE);

	highlights = input<HighlightViewModel[]>([]);

	tileColors = computed(() => {
		const shuffled = [...this.palette].sort(() => Math.random() - 0.5);
		return this.highlights().map((_, i) => shuffled[i]);
	});
}
