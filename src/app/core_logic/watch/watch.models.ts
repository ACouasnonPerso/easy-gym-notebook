/**
 * Contract shared with the Apple Watch app (ios/App/EasyGymWatch/WatchModels.swift).
 * Any change here must be mirrored on the Swift side.
 */

export const WATCH_PROTOCOL_VERSION = 1;

export interface WatchExercise {
	id: string;
	name: string;
	muscleLabel: string | null;
	muscleColor: string | null;
	sets: number;
	reps: number;
	loadLabel: string;
	isCardio: boolean;
	breakDurationSeconds: number;
	status: "pending" | "validated";
	rating: number | null;
}

export interface WatchSessionPayload {
	id: string;
	title: string;
	startedAt: string;
	exercises: WatchExercise[];
}

export interface WatchRatingOption {
	value: number;
	display: string;
	label: string;
}

export interface WatchSnapshot {
	version: number;
	session: WatchSessionPayload | null;
	ratingOptions: WatchRatingOption[];
	labels: Record<string, string>;
	appliedActionIds: string[];
}

export interface WatchRateAction {
	id: string;
	type: "rate";
	sessionId: string;
	exerciseId: string;
	rating: number | null;
	at: string;
}

export interface WatchValidateAction {
	id: string;
	type: "validate";
	sessionId: string;
	exerciseId: string;
	at: string;
}

export type WatchAction = WatchRateAction | WatchValidateAction;

/** Connection state of the Apple Watch, read from the native WatchConnectivity session. */
export interface WatchStatus {
	supported: boolean;
	activation: "activated" | "inactive" | "notActivated";
	paired: boolean;
	appInstalled: boolean;
	/** The watch app is running and can receive messages right now. */
	reachable: boolean;
	lastSnapshotSentAt: string | null;
	lastActionReceivedAt: string | null;
	pendingActions: number;
	/** Most recent first. */
	errors: WatchError[];
}

export interface WatchError {
	at: string;
	message: string;
}
