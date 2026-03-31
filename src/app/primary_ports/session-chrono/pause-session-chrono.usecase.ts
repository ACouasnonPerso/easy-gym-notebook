import { Injectable, inject } from "@angular/core";
import { SessionChronoService } from "../../core_logic/chrono/session-chrono.service";

@Injectable({ providedIn: "root" })
export class PauseSessionChronoUseCase {
	private readonly sessionChronoService = inject(SessionChronoService);

	pause(): void {
		this.sessionChronoService.pause();
	}

	resumeSession(): void {
		this.sessionChronoService.resumeSession();
	}

	restartSession(): void {
		this.sessionChronoService.start();
	}

	pauseForSession(sessionId: string): void {
		this.sessionChronoService.pauseForSession(sessionId);
	}

	resumeForSession(sessionId: string): void {
		this.sessionChronoService.resumeForSession(sessionId);
	}

	startForSession(sessionId: string): void {
		this.sessionChronoService.startForSession(sessionId);
	}
}
