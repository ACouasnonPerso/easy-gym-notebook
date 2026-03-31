import { Component, ChangeDetectionStrategy, inject, computed } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { SessionDetailUiService } from "../session-detail/session-detail-ui.service";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-session-bottom-nav",
	standalone: true,
	imports: [RouterLink, RouterLinkActive, TranslateModule],
	templateUrl: "./session-bottom-nav.component.html",
	styleUrl: "./session-bottom-nav.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionBottomNavComponent {
	private readonly uiService = inject(SessionDetailUiService);

	readonly sessionLink = computed(() => {
		const id = this.uiService.currentSessionId();
		return id ? `/sessions/${id}` : "/sessions";
	});

	openAddExercise(): void {
		this.uiService.openAddExerciseForm();
	}
}
