import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { WatchStatusService } from "./watch-status.service";
import { WatchSyncService } from "./watch-sync.service";
import { WatchError, WatchStatus } from "./watch.models";
import { WATCH_GATEWAY } from "../../secondary_ports/watch/watch.gateway.interface";

class FakeGateway {
	available = true;
	status: WatchStatus = {
		supported: true,
		activation: "activated",
		paired: true,
		appInstalled: true,
		reachable: false,
		lastSnapshotSentAt: null,
		lastActionReceivedAt: null,
		pendingActions: 0,
		errors: [],
	};
	statusListener: (() => void) | null = null;
	cleared = false;

	isAvailable(): boolean {
		return this.available;
	}
	async getStatus(): Promise<WatchStatus> {
		return this.status;
	}
	async clearErrors(): Promise<void> {
		this.cleared = true;
		this.status = { ...this.status, errors: [] };
	}
	onStatusChanged(listener: () => void): void {
		this.statusListener = listener;
	}
}

class FakeWatchSync {
	readonly errors = signal<WatchError[]>([]);
	clearErrors(): void {
		this.errors.set([]);
	}
}

describe("WatchStatusService", () => {
	let gateway: FakeGateway;
	let watchSync: FakeWatchSync;
	let service: WatchStatusService;

	beforeEach(() => {
		gateway = new FakeGateway();
		watchSync = new FakeWatchSync();
		TestBed.configureTestingModule({
			providers: [
				{ provide: WATCH_GATEWAY, useValue: gateway },
				{ provide: WatchSyncService, useValue: watchSync },
			],
		});
		service = TestBed.inject(WatchStatusService);
	});

	it("is inactive before the first refresh", () => {
		expect(service.level()).toBe("inactive");
	});

	it("reads the native status on refresh", async () => {
		await service.refresh();
		expect(service.level()).toBe("standby");
	});

	it("refreshes when the native side reports a change", async () => {
		await service.refresh();
		gateway.status = { ...gateway.status, reachable: true };
		gateway.statusListener?.();
		await new Promise((resolve) => setTimeout(resolve));
		expect(service.level()).toBe("connected");
	});

	it("merges native and sync errors, most recent first", async () => {
		gateway.status = { ...gateway.status, errors: [{ at: "2026-11-20T10:00:00Z", message: "native" }] };
		watchSync.errors.set([{ at: "2026-11-20T11:00:00Z", message: "sync" }]);
		await service.refresh();
		expect(service.errors().map((e) => e.message)).toEqual(["sync", "native"]);
	});

	it("clears both native and sync errors", async () => {
		gateway.status = { ...gateway.status, errors: [{ at: "2026-11-20T10:00:00Z", message: "native" }] };
		watchSync.errors.set([{ at: "2026-11-20T11:00:00Z", message: "sync" }]);
		await service.refresh();
		await service.clearErrors();
		expect(gateway.cleared).toBeTrue();
		expect(service.errors()).toEqual([]);
	});

	it("does nothing outside the iOS app", async () => {
		gateway.available = false;
		await service.refresh();
		expect(service.status()).toBeNull();
		expect(gateway.statusListener).toBeNull();
	});
});
