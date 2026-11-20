import { WatchStatus } from "./watch.models";

/**
 * - connected: the watch app is open and in range, everything syncs live;
 * - standby: paired and installed, the session is sent as soon as the watch app opens;
 * - notInstalled: a watch is paired but Easy Gym is not installed on it;
 * - notPaired: no Apple Watch paired with this iPhone;
 * - inactive: the connection is not started (or not supported).
 */
export type WatchConnectionLevel = "connected" | "standby" | "notInstalled" | "notPaired" | "inactive";

export function watchConnectionLevel(status: WatchStatus | null): WatchConnectionLevel {
	if (!status || !status.supported || status.activation !== "activated") return "inactive";
	if (!status.paired) return "notPaired";
	if (!status.appInstalled) return "notInstalled";
	return status.reachable ? "connected" : "standby";
}
