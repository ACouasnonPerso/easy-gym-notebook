import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { ApplySessionTemplateUseCase } from "./apply-session-template.usecase";
import { ExerciseService } from "../../core_logic/session-detail/exercise.service";
import { SessionService } from "../../core_logic/session/session.service";
import { AnalyticsService } from "../../core_logic/analytics/analytics.service";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { Exercise, MuscleGroup, Session } from "../../core_logic/shared/models";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "src-1",
		sessionId: "source",
		name: "Biceps curl",
		muscleGroup: MuscleGroup.Biceps,
		muscleGroups: [MuscleGroup.Biceps],
		weightKg: 20,
		sets: 5,
		reps: 10,
		breakDurationSeconds: 90,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: 15,
		comment: "dur",
		...overrides,
	};
}

describe("ApplySessionTemplateUseCase", () => {
	let added: Exercise[];
	let currentSession: ReturnType<typeof signal<Session | null>>;
	let updateCurrentSession: jasmine.Spy;
	let trackSessionStarted: jasmine.Spy;

	beforeEach(() => {
		added = [];
		currentSession = signal<Session | null>({
			id: "target",
			date: new Date(),
			status: "active",
			durationSeconds: 0,
			muscleGroup: null,
			exercises: [],
		});
		updateCurrentSession = jasmine.createSpy("updateCurrentSession").and.callFake(async (changes: Partial<Session>) => {
			currentSession.set({ ...currentSession()!, ...changes });
		});
		trackSessionStarted = jasmine.createSpy("trackSessionStarted");

		TestBed.configureTestingModule({
			providers: [
				{
					provide: EXERCISE_REPOSITORY,
					useValue: {
						getBySessionId: async () => [
							makeExercise({ id: "a", name: "Biceps curl" }),
							makeExercise({ id: "b", name: "Leg curl", status: "cancelled" }),
							makeExercise({ id: "c", name: "Triceps poulie", muscleGroup: MuscleGroup.Triceps, status: "pending" }),
						],
					},
				},
				{ provide: ExerciseService, useValue: { add: async (e: Exercise) => void added.push(e) } },
				{ provide: SessionService, useValue: { currentSession, updateCurrentSession } },
				{ provide: AnalyticsService, useValue: { trackSessionStarted } },
			],
		});
	});

	it("copies the non cancelled exercises of the source session as pending exercises of the target session", async () => {
		await TestBed.inject(ApplySessionTemplateUseCase).execute("target", "source");

		expect(added.map((e) => e.name)).toEqual(["Biceps curl", "Triceps poulie"]);
		for (const exercise of added) {
			expect(exercise.sessionId).toBe("target");
			expect(exercise.status).toBe("pending");
			expect(exercise.rating).toBeNull();
			expect(exercise.comment).toBeNull();
			expect(["a", "c"]).not.toContain(exercise.id);
		}
		expect(added[0].sets).toBe(5);
		expect(added[0].weightKg).toBe(20);
	});

	it("sets the session muscle group from the first exercise when it has none", async () => {
		await TestBed.inject(ApplySessionTemplateUseCase).execute("target", "source");

		expect(updateCurrentSession).toHaveBeenCalledWith({ muscleGroup: MuscleGroup.Biceps });
		expect(trackSessionStarted).toHaveBeenCalledTimes(1);
	});

	it("keeps the session muscle group when it already has one", async () => {
		currentSession.set({ ...currentSession()!, muscleGroup: MuscleGroup.Chest });

		await TestBed.inject(ApplySessionTemplateUseCase).execute("target", "source");

		expect(updateCurrentSession).not.toHaveBeenCalled();
	});
});
