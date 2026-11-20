import { Injectable, inject } from "@angular/core";
import { WatchSyncService } from "../../core_logic/watch/watch-sync.service";

@Injectable({ providedIn: "root" })
export class StartWatchSyncUseCase {
	private readonly watchSyncService = inject(WatchSyncService);

	execute(): void {
		this.watchSyncService.start();
	}

	/** The phone app came back to the foreground: apply what was done on the watch meanwhile. */
	onAppVisible(): void {
		void this.watchSyncService.processPendingActions();
	}
}
