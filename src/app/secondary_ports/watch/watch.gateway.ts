import { Injectable, inject } from "@angular/core";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { IWatchGateway } from "./watch.gateway.interface";
import { WatchAction, WatchSnapshot } from "../../core_logic/watch/watch.models";
import { WatchActionMapper } from "../../secondary_adapters/watch/watch-action.mapper";

interface WatchConnectivityPlugin {
	pushSnapshot(options: { json: string }): Promise<void>;
	getPendingActions(): Promise<{ actions: string[] }>;
	acknowledgeActions(options: { ids: string[] }): Promise<void>;
	addListener(eventName: "actionsAvailable", listener: () => void): Promise<{ remove: () => Promise<void> }>;
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
}
