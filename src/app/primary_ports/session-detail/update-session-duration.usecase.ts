import { Injectable, inject } from "@angular/core";
import { SessionService } from "../../core_logic/session/session.service";

@Injectable({ providedIn: "root" })
export class UpdateSessionDurationUseCase {
	private readonly sessionService = inject(SessionService);

	execute(durationSeconds: number): void {
		this.sessionService.updateCurrentSession({ durationSeconds });
	}
}
