import { TestBed } from "@angular/core/testing";
import { AddExerciseUseCase } from "../session-detail/add-exercise.usecase";
import { CreateSessionUseCase } from "./create-session.usecase";
import { ExerciseService } from "../../core_logic/session-detail/exercise.service";
import { MuscleGroupDetectorService } from "../../core_logic/shared/muscle-group-detector.service";
import { SessionService } from "../../core_logic/session/session.service";
import { SessionChronoService } from "../../core_logic/chrono/session-chrono.service";
import { AnalyticsService } from "../../core_logic/analytics/analytics.service";
import { Exercise, MuscleGroup, Session } from "../../core_logic/shared/models";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { ANALYTICS_REPOSITORY } from "../../secondary_ports/analytics/analytics.repository.interface";
import { TranslateService } from "@ngx-translate/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

const MUSCLE_DETECTOR_FR: Record<string, string> = {
	"muscleDetector.chest": "développé couché,développé,developpe,pectoraux,poitrine,bench,pecs,dc",
	"muscleDetector.back": "dorsaux,tirage,rowing,tractions,pull,dos",
	"muscleDetector.backHamstrings": "soulevé de terre,deadlift",
	"muscleDetector.shoulders": "deltoides,deltoide,militaire,epaules,epaule,ohp",
	"muscleDetector.biceps": "biceps,bibi",
	"muscleDetector.triceps": "triceps,pushdown,tritri",
	"muscleDetector.tricepsChest": "dips",
	"muscleDetector.glutesQuads": "squats,squat,fentes",
	"muscleDetector.forearms": "avant-bras,avant bras,grip",
	"muscleDetector.abs": "abdominaux,planche,crunch,abdos,gainage",
	"muscleDetector.quads": "leg extension,legs extension,leg press,legs press,quadriceps,quads,quadri",
	"muscleDetector.hamstrings": "leg curl,ischios,ischio",
	"muscleDetector.glutes": "hip thrust,fessiers,fessier,glutes,booty,fesses,hip trust",
	"muscleDetector.calves": "mollets,mollet,calves,calf",
	"muscleDetector.traps": "trapezes,trapèzes,shrug,trap",
	"muscleDetector.adductors": "adducteurs,adducteur,inner thigh,adduction",
	"muscleDetector.abductors": "abducteurs,abducteur,outer thigh,abduction",
};
const translateServiceStub = {
	instant: (key: string) => MUSCLE_DETECTOR_FR[key] ?? key,
	onLangChange: new Subject(),
};

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "session-1",
		date: new Date("2026-03-28"),
		status: "active",
		durationSeconds: 0,
		muscleGroup: null,
		exercises: [],
		...overrides,
	};
}

describe("trackSessionStarted — muscleGroup propagation", () => {
	let addExerciseUseCase: AddExerciseUseCase;
	let exerciseRepoSpy: jasmine.SpyObj<any>;
	let sessionRepoSpy: jasmine.SpyObj<any>;
	let analyticsRepoSpy: jasmine.SpyObj<any>;
	let analyticsService: AnalyticsService;
	let sessionService: SessionService;

	beforeEach(() => {
		exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);
		exerciseRepoSpy.save.and.returnValue(Promise.resolve());
		exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));

		sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		sessionRepoSpy.save.and.returnValue(Promise.resolve());
		sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		analyticsRepoSpy = jasmine.createSpyObj("IAnalyticsRepository", [
			"trackSessionStarted",
			"trackSessionUpdated",
			"trackSessionCompleted",
		]);
		analyticsRepoSpy.trackSessionStarted.and.returnValue(Promise.resolve());
		analyticsRepoSpy.trackSessionUpdated.and.returnValue(Promise.resolve());
		analyticsRepoSpy.trackSessionCompleted.and.returnValue(Promise.resolve());

		TestBed.configureTestingModule({
			providers: [
				AddExerciseUseCase,
				CreateSessionUseCase,
				ExerciseService,
				SessionService,
				SessionChronoService,
				MuscleGroupDetectorService,
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{ provide: ANALYTICS_REPOSITORY, useValue: analyticsRepoSpy },
				{ provide: TranslateService, useValue: translateServiceStub },
				{ provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
			],
		});

		addExerciseUseCase = TestBed.inject(AddExerciseUseCase);
		analyticsService = TestBed.inject(AnalyticsService);
		sessionService = TestBed.inject(SessionService);
	});

	describe("AddExerciseUseCase", () => {
		it("should call trackSessionStarted with the muscleGroup when the first exercise gives the session its muscleGroup", async () => {
			sessionService.currentSession.set(makeSession({ muscleGroup: null }));
			spyOn(analyticsService, "trackSessionStarted");

			await addExerciseUseCase.execute({
				name: "Curl biceps",
				weightKg: 15,
				sets: 3,
				reps: 12,
				breakDurationSeconds: 60,
				sessionId: "session-1",
			});

			expect(analyticsService.trackSessionStarted).toHaveBeenCalledOnceWith(
				jasmine.objectContaining({ muscleGroup: MuscleGroup.Biceps })
			);
		});

		it("should NOT call trackSessionStarted when the session already has a muscleGroup", async () => {
			sessionService.currentSession.set(makeSession({ muscleGroup: MuscleGroup.Back }));
			spyOn(analyticsService, "trackSessionStarted");

			await addExerciseUseCase.execute({
				name: "Squat quadriceps",
				weightKg: 100,
				sets: 5,
				reps: 5,
				breakDurationSeconds: 180,
				sessionId: "session-1",
			});

			expect(analyticsService.trackSessionStarted).not.toHaveBeenCalled();
		});

		it("should NOT call trackSessionStarted when the exercise is cardio", async () => {
			sessionService.currentSession.set(makeSession({ muscleGroup: null }));
			spyOn(analyticsService, "trackSessionStarted");

			await addExerciseUseCase.execute({
				name: "Course à pied",
				weightKg: 0,
				sets: 0,
				reps: 0,
				breakDurationSeconds: 0,
				sessionId: "session-1",
				isCardio: true,
				durationSeconds: 1800,
				distanceKm: null,
			});

			expect(analyticsService.trackSessionStarted).not.toHaveBeenCalled();
		});
	});

	describe("CreateSessionUseCase", () => {
		it("should NOT call trackSessionStarted when creating a new session (muscleGroup is null at that point)", async () => {
			const createUseCase = TestBed.inject(CreateSessionUseCase);
			spyOn(analyticsService, "trackSessionStarted");

			await createUseCase.execute();

			expect(analyticsService.trackSessionStarted).not.toHaveBeenCalled();
		});
	});
});
