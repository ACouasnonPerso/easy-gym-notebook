import { InjectionToken } from "@angular/core";
import { WatchAction, WatchSnapshot, WatchStatus } from "../../core_logic/watch/watch.models";

export interface IWatchGateway {
	/** True only when running on iOS with the native WatchConnectivity plugin. */
	isAvailable(): boolean;
	pushSnapshot(snapshot: WatchSnapshot): Promise<void>;
	/** Actions sent by the watch and not yet acknowledged, oldest first. */
	getPendingActions(): Promise<WatchAction[]>;
	acknowledgeActions(ids: string[]): Promise<void>;
	onActionsAvailable(listener: () => void): void;
	getStatus(): Promise<WatchStatus>;
	clearErrors(): Promise<void>;
	/** Connection state changed or an error was recorded on the native side. */
	onStatusChanged(listener: () => void): void;
}

export const WATCH_GATEWAY = new InjectionToken<IWatchGateway>("WATCH_GATEWAY");

export interface IWatchActionLogRepository {
	getAppliedIds(): string[];
	markApplied(ids: string[]): void;
}

export const WATCH_ACTION_LOG_REPOSITORY = new InjectionToken<IWatchActionLogRepository>("WATCH_ACTION_LOG_REPOSITORY");
