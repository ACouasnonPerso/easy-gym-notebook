import { Injectable, computed, inject, signal } from "@angular/core";
import { WATCH_GATEWAY } from "../../secondary_ports/watch/watch.gateway.interface";
import { WatchSyncService } from "./watch-sync.service";
import { WatchError, WatchStatus } from "./watch.models";
import { watchConnectionLevel } from "./watch-status";

const MAX_ERRORS = 10;

/** Connection state of the Apple Watch and recent sync errors, for the status screen. */
@Injectable({ providedIn: "root" })
export class WatchStatusService {
	private readonly gateway = inject(WATCH_GATEWAY);
	private readonly watchSyncService = inject(WatchSyncService);

	private readonly nativeStatus = signal<WatchStatus | null>(null);
	private listening = false;

	readonly level = computed(() => watchConnectionLevel(this.nativeStatus()));
	readonly status = this.nativeStatus.asReadonly();

	/** Native errors (connection, workout launch) and web app errors (sync), most recent first. */
	readonly errors = computed<WatchError[]>(() =>
		[...(this.nativeStatus()?.errors ?? []), ...this.watchSyncService.errors()]
			.sort((a, b) => b.at.localeCompare(a.at))
			.slice(0, MAX_ERRORS)
	);

	isAvailable(): boolean {
		return this.gateway.isAvailable();
	}

	async refresh(): Promise<void> {
		if (!this.isAvailable()) return;
		if (!this.listening) {
			this.listening = true;
			this.gateway.onStatusChanged(() => void this.refresh());
		}
		try {
			this.nativeStatus.set(await this.gateway.getStatus());
		} catch (error) {
			console.warn("[WatchStatus]", error);
		}
	}

	async clearErrors(): Promise<void> {
		this.watchSyncService.clearErrors();
		if (!this.isAvailable()) return;
		await this.gateway.clearErrors();
		await this.refresh();
	}
}
