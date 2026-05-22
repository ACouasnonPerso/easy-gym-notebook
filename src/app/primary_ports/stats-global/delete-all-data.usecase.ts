import { Injectable, inject } from "@angular/core";
import { SessionService } from "../../core_logic/session/session.service";

@Injectable({ providedIn: "root" })
export class DeleteAllDataUseCase {
	private readonly sessionService = inject(SessionService);

	async execute(): Promise<void> {
		const sessions = this.sessionService._sessions();
		for (const session of sessions) {
			await this.sessionService.delete(session.id);
		}
		await this.sessionService.loadAll();
	}
}
