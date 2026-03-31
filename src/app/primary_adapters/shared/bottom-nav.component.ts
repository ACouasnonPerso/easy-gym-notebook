import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { CreateSessionUseCase } from "../../primary_ports/session-list/create-session.usecase";
import { TranslateModule } from "@ngx-translate/core";
import { HapticService } from "../../core_logic/shared/haptic.service";

@Component({
	selector: "app-bottom-nav",
	standalone: true,
	imports: [RouterLink, RouterLinkActive, TranslateModule],
	templateUrl: "./bottom-nav.component.html",
	styleUrl: "./bottom-nav.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
	private readonly createSessionUseCase = inject(CreateSessionUseCase);
	private readonly haptic = inject(HapticService);

	createSession(): void {
		this.haptic.vibrate();
		this.createSessionUseCase.execute();
	}
}
