import { Component, output, ChangeDetectionStrategy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-chrono-back-button",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./chrono-back-button.component.html",
	styleUrl: "./chrono-back-button.component.css",
})
export class ChronoBackButtonComponent {
	readonly back = output<void>();
}
