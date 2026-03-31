import { Injectable, inject } from "@angular/core";
import { SessionChronoService } from "../../core_logic/chrono/session-chrono.service";

@Injectable({ providedIn: "root" })
export class SetSessionChronoUseCase {
	private readonly sessionChronoService = inject(SessionChronoService);

	execute(seconds: number): void {
		this.sessionChronoService.overrideElapsed(seconds);
	}

	executeForSession(sessionId: string, seconds: number): void {
		this.sessionChronoService.overrideElapsedForSession(sessionId, seconds);
	}
}
