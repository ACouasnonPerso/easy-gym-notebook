import { Injectable, inject } from "@angular/core";
import { SessionService } from "../../core_logic/session/session.service";

@Injectable({ providedIn: "root" })
export class UpdateSessionDateUseCase {
	private readonly sessionService = inject(SessionService);

	execute(date: Date): void {
		this.sessionService.updateCurrentSession({ date });
	}
}
