import { Injectable, inject } from "@angular/core";
import { WatchStatusService } from "../../core_logic/watch/watch-status.service";

@Injectable({ providedIn: "root" })
export class WatchStatusUseCase {
	private readonly watchStatusService = inject(WatchStatusService);

	readonly level = this.watchStatusService.level;
	readonly status = this.watchStatusService.status;
	readonly errors = this.watchStatusService.errors;

	/** False outside the iOS app: the watch icon is then hidden. */
	isAvailable(): boolean {
		return this.watchStatusService.isAvailable();
	}

	refresh(): Promise<void> {
		return this.watchStatusService.refresh();
	}

	clearErrors(): Promise<void> {
		return this.watchStatusService.clearErrors();
	}
}
