import { Component, ChangeDetectionStrategy, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-end-session-modal",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./end-session-modal.component.html",
	styleUrl: "./end-session-modal.component.scss",
})
export class EndSessionModalComponent {
	readonly confirmed = output<void>();
	readonly cancelled = output<void>();
}
