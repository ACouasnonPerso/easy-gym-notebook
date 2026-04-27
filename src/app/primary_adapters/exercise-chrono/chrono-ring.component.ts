import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ChronoState } from "../../core_logic/exercise-chrono/exercise-chrono.service";

@Component({
	selector: "app-chrono-ring",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./chrono-ring.component.html",
	styleUrl: "./chrono-ring.component.css",
})
export class ChronoRingComponent {
	readonly formattedTime = input.required<string>();
	readonly statusLabel = input.required<string>();
	readonly ringColor = input.required<string>();
	readonly ringOffset = input.required<number>();
	readonly isBlinking = input<boolean>(false);
	readonly chronoState = input<ChronoState>("initial");
}
