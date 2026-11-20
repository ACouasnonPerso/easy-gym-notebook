import { watchConnectionLevel } from "./watch-status";
import { WatchStatus } from "./watch.models";

function makeStatus(overrides: Partial<WatchStatus> = {}): WatchStatus {
	return {
		supported: true,
		activation: "activated",
		paired: true,
		appInstalled: true,
		reachable: true,
		lastSnapshotSentAt: null,
		lastActionReceivedAt: null,
		pendingActions: 0,
		errors: [],
		...overrides,
	};
}

describe("watchConnectionLevel", () => {
	it("is inactive without status", () => {
		expect(watchConnectionLevel(null)).toBe("inactive");
	});

	it("is inactive when WatchConnectivity is not supported", () => {
		expect(watchConnectionLevel(makeStatus({ supported: false }))).toBe("inactive");
	});

	it("is inactive while the session is not activated", () => {
		expect(watchConnectionLevel(makeStatus({ activation: "inactive" }))).toBe("inactive");
	});

	it("is notPaired when no watch is paired", () => {
		expect(watchConnectionLevel(makeStatus({ paired: false, appInstalled: false, reachable: false }))).toBe(
			"notPaired"
		);
	});

	it("is notInstalled when the watch app is missing", () => {
		expect(watchConnectionLevel(makeStatus({ appInstalled: false, reachable: false }))).toBe("notInstalled");
	});

	it("is standby when the watch app is installed but not open", () => {
		expect(watchConnectionLevel(makeStatus({ reachable: false }))).toBe("standby");
	});

	it("is connected when the watch app is reachable", () => {
		expect(watchConnectionLevel(makeStatus())).toBe("connected");
	});
});
