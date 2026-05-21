import { TestBed } from "@angular/core/testing";
import { GetGlobalStatsUseCase } from "./get-global-stats.usecase";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { MILESTONE_REPOSITORY } from "../../secondary_ports/highlight-stats/milestone-repository.interface";
import { Session, Exercise } from "../../core_logic/shared/models";

describe("GetGlobalStatsUseCase", () => {
	let useCase: GetGlobalStatsUseCase;

	beforeEach(() => {
		const sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll"]);
		const exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll"]);
		const milestoneRepoSpy = jasmine.createSpyObj("MilestoneRepository", ["getLastMilestoneKg", "setLastMilestoneKg"]);

		sessionRepoSpy.getAll.and.returnValue(Promise.resolve([] as Session[]));
		exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([] as Exercise[]));
		milestoneRepoSpy.getLastMilestoneKg.and.returnValue(0);

		TestBed.configureTestingModule({
			providers: [
				GetGlobalStatsUseCase,
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
				{ provide: MILESTONE_REPOSITORY, useValue: milestoneRepoSpy },
			],
		});

		useCase = TestBed.inject(GetGlobalStatsUseCase);
	});

	it("should expose a highlights signal returning an array", () => {
		expect(useCase.highlights).toBeDefined();
		expect(Array.isArray(useCase.highlights())).toBeTrue();
	});

	it("should return an empty highlights array when there is no session data", () => {
		expect(useCase.highlights()).toEqual([]);
	});
});
