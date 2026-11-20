import { Injectable, inject } from "@angular/core";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { IWatchGateway } from "./watch.gateway.interface";
import { WatchAction, WatchSnapshot, WatchStatus } from "../../core_logic/watch/watch.models";
import { WatchActionMapper } from "../../secondary_adapters/watch/watch-action.mapper";

interface WatchConnectivityPlugin {
	pushSnapshot(options: { json: string }): Promise<void>;
	getPendingActions(): Promise<{ actions: string[] }>;
	acknowledgeActions(options: { ids: string[] }): Promise<void>;
	getStatus(): Promise<RawWatchStatus>;
	clearErrors(): Promise<void>;
	addListener(
		eventName: "actionsAvailable" | "statusChanged",
		listener: () => void
	): Promise<{ remove: () => Promise<void> }>;
}

interface RawWatchStatus {
	supported?: boolean;
	activation?: string;
	paired?: boolean;
	appInstalled?: boolean;
	reachable?: boolean;
	lastSnapshotSentAt?: string;
	lastActionReceivedAt?: string;
	pendingActions?: number;
	errors?: { at?: string; message?: string }[];
}

const PLUGIN_NAME = "WatchConnectivity";

const WatchConnectivity = registerPlugin<WatchConnectivityPlugin>(PLUGIN_NAME);

@Injectable()
export class WatchGateway implements IWatchGateway {
	private readonly mapper = inject(WatchActionMapper);

	isAvailable(): boolean {
		return Capacitor.getPlatform() === "ios" && Capacitor.isPluginAvailable(PLUGIN_NAME);
	}

	async pushSnapshot(snapshot: WatchSnapshot): Promise<void> {
		await WatchConnectivity.pushSnapshot({ json: JSON.stringify(snapshot) });
	}

	async getPendingActions(): Promise<WatchAction[]> {
		const { actions } = await WatchConnectivity.getPendingActions();
		return (actions ?? []).map((raw) => this.mapper.fromJson(raw)).filter((a): a is WatchAction => a !== null);
	}

	async acknowledgeActions(ids: string[]): Promise<void> {
		if (ids.length === 0) return;
		await WatchConnectivity.acknowledgeActions({ ids });
	}

	onActionsAvailable(listener: () => void): void {
		WatchConnectivity.addListener("actionsAvailable", listener);
	}

	async getStatus(): Promise<WatchStatus> {
		const raw = await WatchConnectivity.getStatus();
		const activation =
			raw.activation === "activated" || raw.activation === "inactive" ? raw.activation : "notActivated";
		return {
			supported: raw.supported === true,
			activation,
			paired: raw.paired === true,
			appInstalled: raw.appInstalled === true,
			reachable: raw.reachable === true,
			lastSnapshotSentAt: raw.lastSnapshotSentAt ?? null,
			lastActionReceivedAt: raw.lastActionReceivedAt ?? null,
			pendingActions: raw.pendingActions ?? 0,
			errors: (raw.errors ?? [])
				.filter((e) => typeof e.at === "string" && typeof e.message === "string")
				.map((e) => ({ at: e.at as string, message: e.message as string })),
		};
	}

	async clearErrors(): Promise<void> {
		await WatchConnectivity.clearErrors();
	}

	onStatusChanged(listener: () => void): void {
		WatchConnectivity.addListener("statusChanged", listener);
	}
}
