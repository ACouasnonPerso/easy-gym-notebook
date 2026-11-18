import { TestBed } from "@angular/core/testing";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { WatchSyncService } from "./watch-sync.service";
import { WatchAction, WatchSnapshot } from "./watch.models";
import { Exercise, MuscleGroup, Session } from "../shared/models";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import {
	IWatchActionLogRepository,
	IWatchGateway,
	WATCH_ACTION_LOG_REPOSITORY,
	WATCH_GATEWAY,
} from "../../secondary_ports/watch/watch.gateway.interface";
import { ANALYTICS_REPOSITORY } from "../../secondary_ports/analytics/analytics.repository.interface";
import { MassUnitService } from "../mass-unit/mass-unit.service";

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(): Observable<TranslationObject> {
		return of({
			watch: { sessionTitle: "Séance", bodyweight: "PDC" },
			muscleGroups: { Chest: "Pecs" },
		} as unknown as TranslationObject);
	}
}

class FakeWatchGateway implements IWatchGateway {
	available = true;
	pushed: WatchSnapshot[] = [];
	pending: WatchAction[] = [];
	acknowledged: string[] = [];
	listener: (() => void) | null = null;

	isAvailable(): boolean {
		return this.available;
	}
	async pushSnapshot(snapshot: WatchSnapshot): Promise<void> {
		this.pushed.push(snapshot);
	}
	async getPendingActions(): Promise<WatchAction[]> {
		return this.pending.filter((a) => !this.acknowledged.includes(a.id));
	}
	async acknowledgeActions(ids: string[]): Promise<void> {
		this.acknowledged.push(...ids);
	}
	onActionsAvailable(listener: () => void): void {
		this.listener = listener;
	}
	get last(): WatchSnapshot {
		return this.pushed[this.pushed.length - 1];
	}
}

class InMemoryActionLog implements IWatchActionLogRepository {
	ids: string[] = [];
	getAppliedIds(): string[] {
		return [...this.ids];
	}
	markApplied(ids: string[]): void {
		this.ids.push(...ids.filter((id) => !this.ids.includes(id)));
	}
}

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "s1",
		date: new Date(),
		status: "active",
		durationSeconds: 0,
		muscleGroup: null,
		exercises: [],
		...overrides,
	};
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "e1",
		sessionId: "s1",
		name: "Développé couché",
		muscleGroup: MuscleGroup.Chest,
		muscleGroups: [MuscleGroup.Chest],
		weightKg: 60,
		sets: 4,
		reps: 10,
		breakDurationSeconds: 90,
		status: "pending",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		comment: null,
		...overrides,
	};
}

function rateAction(overrides: Partial<WatchAction> = {}): WatchAction {
	return {
		id: "a1",
		type: "rate",
		sessionId: "s1",
		exerciseId: "e1",
		rating: 16,
		at: "2026-11-18T18:00:00.000Z",
		...overrides,
	} as WatchAction;
}

describe("WatchSyncService", () => {
	let service: WatchSyncService;
	let gateway: FakeWatchGateway;
	let actionLog: InMemoryActionLog;
	let sessions: Session[];
	let exercises: Exercise[];

	beforeEach(() => {
		gateway = new FakeWatchGateway();
		actionLog = new InMemoryActionLog();
		sessions = [makeSession()];
		exercises = [makeExercise()];

		TestBed.configureTestingModule({
			imports: [TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } })],
			providers: [
				{ provide: WATCH_GATEWAY, useValue: gateway },
				{ provide: WATCH_ACTION_LOG_REPOSITORY, useValue: actionLog },
				{
					provide: SESSION_REPOSITORY,
					useValue: {
						getAll: async () => sessions,
						getById: async (id: string) => sessions.find((s) => s.id === id) ?? null,
						save: async () => undefined,
						delete: async () => undefined,
					},
				},
				{
					provide: EXERCISE_REPOSITORY,
					useValue: {
						getAll: async () => exercises,
						getBySessionId: async (id: string) => exercises.filter((e) => e.sessionId === id),
						getById: async (id: string) => exercises.find((e) => e.id === id) ?? null,
						save: async (exercise: Exercise) => {
							exercises = exercises.map((e) => (e.id === exercise.id ? exercise : e));
						},
						delete: async () => undefined,
					},
				},
				{
					provide: ANALYTICS_REPOSITORY,
					useValue: {
						trackSessionStarted: async () => undefined,
						trackSessionUpdated: async () => undefined,
						trackSessionCompleted: async () => undefined,
					},
				},
			],
		});
		TestBed.inject(TranslateService).use("fr");
		TestBed.inject(MassUnitService).activeMassUnit.set("metric");
		service = TestBed.inject(WatchSyncService);
	});

	async function startAndSettle(): Promise<void> {
		service.start();
		await service.processPendingActions();
	}

	it("does nothing when no watch is available", async () => {
		gateway.available = false;
		await startAndSettle();
		expect(service.isStarted()).toBeFalse();
		expect(gateway.pushed.length).toBe(0);
	});

	it("pushes the active session to the watch on start", async () => {
		await startAndSettle();
		expect(gateway.last.session?.id).toBe("s1");
		expect(gateway.last.session?.title).toBe("Pecs");
		expect(gateway.last.session?.exercises[0].loadLabel).toBe("60 kg");
		expect(gateway.last.labels["sessionTitle"]).toBe("Séance");
	});

	it("pushes a null session when nothing is active", async () => {
		sessions = [makeSession({ status: "completed" })];
		await startAndSettle();
		expect(gateway.last.session).toBeNull();
	});

	it("does not push the same snapshot twice", async () => {
		await startAndSettle();
		await service.refresh();
		expect(gateway.pushed.length).toBe(1);
	});

	it("applies a rating done on the watch and acknowledges it", async () => {
		gateway.pending = [rateAction()];
		await startAndSettle();
		expect(exercises[0].rating).toBe(16);
		expect(gateway.acknowledged).toEqual(["a1"]);
		expect(gateway.last.appliedActionIds).toEqual(["a1"]);
		expect(gateway.last.session?.exercises[0].rating).toBe(16);
	});

	it("clears a rating when the watch sends null", async () => {
		exercises = [makeExercise({ rating: 14 })];
		gateway.pending = [rateAction({ rating: null } as Partial<WatchAction>)];
		await startAndSettle();
		expect(exercises[0].rating).toBeNull();
	});

	it("validates an exercise from the watch", async () => {
		gateway.pending = [{ id: "a2", type: "validate", sessionId: "s1", exerciseId: "e1", at: "2026-11-18T18:01:00Z" }];
		await startAndSettle();
		expect(exercises[0].status).toBe("validated");
		expect(gateway.last.session?.exercises[0].status).toBe("validated");
	});

	it("applies actions in chronological order", async () => {
		gateway.pending = [
			rateAction({ id: "late", rating: 18, at: "2026-11-18T18:05:00Z" } as Partial<WatchAction>),
			rateAction({ id: "early", rating: 12, at: "2026-11-18T18:01:00Z" } as Partial<WatchAction>),
		];
		await startAndSettle();
		expect(exercises[0].rating).toBe(18);
	});

	it("ignores actions already applied, but still acknowledges them", async () => {
		actionLog.ids = ["a1"];
		gateway.pending = [rateAction()];
		await startAndSettle();
		expect(exercises[0].rating).toBeNull();
		expect(gateway.acknowledged).toEqual(["a1"]);
	});

	it("ignores invalid ratings and exercises from another session", async () => {
		gateway.pending = [
			rateAction({ id: "bad-rating", rating: 42 } as Partial<WatchAction>),
			rateAction({ id: "wrong-session", sessionId: "other" }),
		];
		await startAndSettle();
		expect(exercises[0].rating).toBeNull();
		expect(gateway.acknowledged).toEqual(["bad-rating", "wrong-session"]);
	});

	it("processes new actions when the watch notifies", async () => {
		await startAndSettle();
		gateway.pending = [rateAction({ id: "later", rating: 13 } as Partial<WatchAction>)];
		gateway.listener?.();
		await service.processPendingActions();
		expect(exercises[0].rating).toBe(13);
	});
});
