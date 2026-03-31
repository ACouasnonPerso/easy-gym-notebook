import { Component, ChangeDetectionStrategy, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-context-menu",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./context-menu.component.html",
	styleUrl: "./context-menu.component.scss",
})
export class ContextMenuComponent {
	readonly options = input<string[]>([]);
	readonly selected = output<string>();
	readonly closed = output<void>();
}
