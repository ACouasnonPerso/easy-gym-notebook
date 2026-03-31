import { Injectable, Signal, inject } from "@angular/core";
import { ChronoStatus, SessionChronoService } from "../../core_logic/chrono/session-chrono.service";

@Injectable({ providedIn: "root" })
export class GetSessionChronoUseCase {
	private readonly sessionChronoService = inject(SessionChronoService);

	readonly elapsedSeconds = this.sessionChronoService.elapsedSeconds;
	readonly status = this.sessionChronoService.status;

	getElapsedForSession(sessionId: string): Signal<number> {
		return this.sessionChronoService.elapsedSignalForSession(sessionId);
	}

	getStatusForSession(sessionId: string): Signal<ChronoStatus> {
		return this.sessionChronoService.statusSignalForSession(sessionId);
	}
}
