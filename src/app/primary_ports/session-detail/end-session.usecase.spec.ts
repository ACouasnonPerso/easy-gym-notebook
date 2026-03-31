import { TestBed } from "@angular/core/testing";
import { EndSessionUseCase } from "./end-session.usecase";
import { SessionService } from "../../core_logic/session/session.service";
import { SessionChronoService } from "../../core_logic/chrono/session-chrono.service";
import { Exercise, Session } from "../../core_logic/shared/models";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { Router } from "@angular/router";
import { ANALYTICS_REPOSITORY } from "../../secondary_ports/analytics/analytics.repository.interface";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Course à pied",
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 0,
		sets: 0,
		reps: 0,
		breakDurationSeconds: 0,
		status: "pending",
		isCardio: true,
		durationSeconds: 1800,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		...overrides,
	};
}

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "session-1",
		date: new Date("2026-03-27"),
		status: "active",
		durationSeconds: 0,
		muscleGroup: null,
		exercises: [],
		...overrides,
	};
}

describe("EndSessionUseCase — cardio duration auto-fill on end", () => {
	let useCase: EndSessionUseCase;
	let sessionService: SessionService;
	let sessionChronoService: jasmine.SpyObj<SessionChronoService>;
	let sessionRepoSpy: jasmine.SpyObj<any>;
	let exerciseRepoSpy: jasmine.SpyObj<any>;
	let routerSpy: jasmine.SpyObj<Router>;

	beforeEach(() => {
		sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		sessionRepoSpy.save.and.returnValue(Promise.resolve());
		sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);
		exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));

		sessionChronoService = jasmine.createSpyObj("SessionChronoService", ["stopForSession", "stop"]);
		sessionChronoService.stopForSession.and.returnValue(0);
		sessionChronoService.stop.and.returnValue(0);

		routerSpy = jasmine.createSpyObj("Router", ["navigate"]);

		TestBed.configureTestingModule({
			providers: [
				EndSessionUseCase,
				SessionService,
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
				{ provide: SessionChronoService, useValue: sessionChronoService },
				{ provide: Router, useValue: routerSpy },
				{
					provide: ANALYTICS_REPOSITORY,
					useValue: (() => {
						const s = jasmine.createSpyObj("IAnalyticsRepo", [
							"trackSessionStarted",
							"trackSessionUpdated",
							"trackSessionCompleted",
						]);
						s.trackSessionStarted.and.returnValue(Promise.resolve());
						s.trackSessionUpdated.and.returnValue(Promise.resolve());
						s.trackSessionCompleted.and.returnValue(Promise.resolve());
						return s;
					})(),
				},
			],
		});

		useCase = TestBed.inject(EndSessionUseCase);
		sessionService = TestBed.inject(SessionService);
	});

	it("should use the cardio exercise durationSeconds when it is the only exercise", async () => {
		const cardio = makeExercise({ durationSeconds: 1800 });
		sessionService.currentSession.set(makeSession({ exercises: [cardio] }));
		sessionChronoService.stopForSession.and.returnValue(0);

		useCase.execute();
		await Promise.resolve();

		expect(sessionService.currentSession()?.durationSeconds).toBe(1800);
		expect(sessionService.currentSession()?.status).toBe("completed");
	});

	it("should prefer the cardio exercise duration over the chrono elapsed when both are > 0", async () => {
		const cardio = makeExercise({ durationSeconds: 1800 });
		sessionService.currentSession.set(makeSession({ exercises: [cardio] }));
		sessionChronoService.stopForSession.and.returnValue(1850);

		useCase.execute();
		await Promise.resolve();

		expect(sessionService.currentSession()?.durationSeconds).toBe(1800);
	});

	it("should fall back to chrono elapsed when there are multiple exercises", async () => {
		const cardio = makeExercise({ durationSeconds: 1800 });
		const other = makeExercise({ id: "ex-2", isCardio: false });
		sessionService.currentSession.set(makeSession({ exercises: [cardio, other] }));
		sessionChronoService.stopForSession.and.returnValue(2400);

		useCase.execute();
		await Promise.resolve();

		expect(sessionService.currentSession()?.durationSeconds).toBe(2400);
	});

	it("should fall back to chrono elapsed when the single cardio exercise has durationSeconds === 0", async () => {
		const cardio = makeExercise({ durationSeconds: 0 });
		sessionService.currentSession.set(makeSession({ exercises: [cardio] }));
		sessionChronoService.stopForSession.and.returnValue(500);

		useCase.execute();
		await Promise.resolve();

		expect(sessionService.currentSession()?.durationSeconds).toBe(500);
	});

	it("should show the manual override when no cardio duration and elapsed is 0", () => {
		sessionService.currentSession.set(makeSession({ exercises: [] }));
		sessionChronoService.stopForSession.and.returnValue(0);

		useCase.execute();

		expect(useCase.showManualOverride()).toBeTrue();
		expect(routerSpy.navigate).not.toHaveBeenCalled();
	});
});
