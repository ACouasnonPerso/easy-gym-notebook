import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { HighlightViewModel } from "../../core_logic/stats-global/highlight-metric.model";

@Component({
	selector: "app-stats-highlights-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [CommonModule, TranslateModule],
	templateUrl: "./stats-highlights-card.component.html",
	styleUrl: "./stats-highlights-card.component.scss",
})
export class StatsHighlightsCardComponent {
	highlights = input<HighlightViewModel[]>([]);
}
