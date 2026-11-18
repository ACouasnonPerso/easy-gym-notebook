import { Injectable, Injector, effect, inject, untracked } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { WATCH_ACTION_LOG_REPOSITORY, WATCH_GATEWAY } from "../../secondary_ports/watch/watch.gateway.interface";
import { SessionService } from "../session/session.service";
import { ExerciseService } from "../session-detail/exercise.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { MassUnitService } from "../mass-unit/mass-unit.service";
import { isValidRating } from "../shared/rating-options";
import { WatchAction } from "./watch.models";
import { buildWatchSnapshot, findWatchActiveSession } from "./watch-snapshot.builder";

const ACKNOWLEDGED_IDS_SENT_TO_WATCH = 50;

/**
 * Keeps the Apple Watch in sync with the active session:
 * - pushes a snapshot of the active session whenever local data changes;
 * - applies the actions done on the watch (rating, validation) to local data.
 *
 * Every operation is serialized so actions and snapshots never interleave.
 */
@Injectable({ providedIn: "root" })
export class WatchSyncService {
	private readonly gateway = inject(WATCH_GATEWAY);
	private readonly actionLog = inject(WATCH_ACTION_LOG_REPOSITORY);
	private readonly sessionRepo = inject(SESSION_REPOSITORY);
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);
	private readonly sessionService = inject(SessionService);
	private readonly exerciseService = inject(ExerciseService);
	private readonly analyticsService = inject(AnalyticsService);
	private readonly massUnitService = inject(MassUnitService);
	private readonly translate = inject(TranslateService);
	private readonly injector = inject(Injector);

	private started = false;
	private queue: Promise<void> = Promise.resolve();
	private lastPushed: string | null = null;
	private refreshScheduled = false;

	start(): void {
		if (this.started || !this.gateway.isAvailable()) return;
		this.started = true;

		this.gateway.onActionsAvailable(() => void this.processPendingActions());

		effect(
			() => {
				this.sessionService._sessions();
				this.sessionService.currentSession();
				this.exerciseService.exercises();
				this.massUnitService.activeMassUnit();
				untracked(() => this.scheduleRefresh());
			},
			{ injector: this.injector }
		);
		this.translate.onLangChange.subscribe(() => this.scheduleRefresh());

		void this.processPendingActions();
	}

	isStarted(): boolean {
		return this.started;
	}

	processPendingActions(): Promise<void> {
		if (!this.started) return Promise.resolve();
		return this.enqueue(() => this.applyPendingActions());
	}

	refresh(): Promise<void> {
		if (!this.started) return Promise.resolve();
		return this.enqueue(() => this.pushSnapshot());
	}

	private enqueue(task: () => Promise<void>): Promise<void> {
		this.queue = this.queue.then(task).catch((error) => console.warn("[WatchSync]", error));
		return this.queue;
	}

	private scheduleRefresh(): void {
		if (this.refreshScheduled) return;
		this.refreshScheduled = true;
		queueMicrotask(() => {
			this.refreshScheduled = false;
			void this.refresh();
		});
	}

	private async applyPendingActions(): Promise<void> {
		const actions = await this.gateway.getPendingActions();
		if (actions.length > 0) {
			const alreadyApplied = new Set(this.actionLog.getAppliedIds());
			const ordered = [...actions].sort((a, b) => a.at.localeCompare(b.at));
			let changed = false;
			for (const action of ordered) {
				if (alreadyApplied.has(action.id)) continue;
				if (await this.apply(action)) changed = true;
			}
			const ids = actions.map((a) => a.id);
			this.actionLog.markApplied(ids);
			await this.gateway.acknowledgeActions(ids);
			if (changed) await this.sessionService.loadAll();
		}
		await this.pushSnapshot();
	}

	private async apply(action: WatchAction): Promise<boolean> {
		const exercise = await this.exerciseRepo.getById(action.exerciseId);
		if (!exercise || exercise.sessionId !== action.sessionId) return false;

		if (action.type === "rate") {
			if (action.rating !== null && !isValidRating(action.rating)) return false;
			if (exercise.rating === action.rating) return false;
			await this.exerciseService.update(exercise.id, { rating: action.rating });
			return true;
		}

		if (exercise.status === "validated") return false;
		await this.exerciseService.update(exercise.id, { status: "validated" });
		this.trackValidation(action.sessionId);
		return true;
	}

	private trackValidation(sessionId: string): void {
		const session = this.sessionService.currentSession();
		if (!session || session.id !== sessionId) return;
		const validatedNames = this.exerciseService
			.exercises()
			.filter((e) => e.status === "validated")
			.map((e) => e.name);
		this.analyticsService.trackSessionUpdated(session, validatedNames);
	}

	private async pushSnapshot(): Promise<void> {
		const session = findWatchActiveSession(await this.sessionRepo.getAll(), new Date());
		const exercises = session ? await this.exerciseRepo.getBySessionId(session.id) : [];
		const labels = await this.loadLabels();

		const snapshot = buildWatchSnapshot(session, exercises, {
			translate: (key) => this.translate.instant(key),
			labels,
			massUnit: this.massUnitService.activeMassUnit(),
			appliedActionIds: this.actionLog.getAppliedIds().slice(-ACKNOWLEDGED_IDS_SENT_TO_WATCH),
		});

		const serialized = JSON.stringify(snapshot);
		if (serialized === this.lastPushed) return;
		await this.gateway.pushSnapshot(snapshot);
		this.lastPushed = serialized;
	}

	private async loadLabels(): Promise<Record<string, string>> {
		const raw: unknown = await firstValueFrom(this.translate.get("watch"));
		if (!raw || typeof raw !== "object") return {};
		const labels: Record<string, string> = {};
		for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
			if (typeof value === "string") labels[key] = value;
		}
		return labels;
	}
}
