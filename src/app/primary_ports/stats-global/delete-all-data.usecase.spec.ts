import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { DeleteAllDataUseCase } from "./delete-all-data.usecase";
import { SessionService } from "../../core_logic/session/session.service";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { Session } from "../../core_logic/shared/models";

function makeSession(id: string): Session {
	return {
		id,
		date: new Date("2024-01-01"),
		status: "completed",
		durationSeconds: 0,
		muscleGroup: null,
		exercises: [],
	};
}

describe("DeleteAllDataUseCase", () => {
	let useCase: DeleteAllDataUseCase;
	let sessionServiceSpy: jasmine.SpyObj<SessionService> & { _sessions: ReturnType<typeof signal<Session[]>> };
	let sessionRepoSpy: jasmine.SpyObj<{ getAll: any; getById: any; save: any; delete: any }>;
	let exerciseRepoSpy: jasmine.SpyObj<{ getAll: any; getBySessionId: any; save: any; delete: any }>;

	beforeEach(() => {
		const sessionsSignal = signal<Session[]>([]);
		sessionServiceSpy = {
			...jasmine.createSpyObj<SessionService>("SessionService", {
				delete: Promise.resolve(),
				loadAll: Promise.resolve(),
			}),
			_sessions: sessionsSignal,
		} as any;

		sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);

		TestBed.configureTestingModule({
			providers: [
				DeleteAllDataUseCase,
				{ provide: SessionService, useValue: sessionServiceSpy },
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
			],
		});

		useCase = TestBed.inject(DeleteAllDataUseCase);
	});

	it("should call delete once per session and loadAll once at the end", async () => {
		const s1 = makeSession("id-1");
		const s2 = makeSession("id-2");
		const s3 = makeSession("id-3");
		sessionServiceSpy._sessions.set([s1, s2, s3]);

		await useCase.execute();

		expect(sessionServiceSpy.delete).toHaveBeenCalledTimes(3);
		expect(sessionServiceSpy.delete).toHaveBeenCalledWith("id-1");
		expect(sessionServiceSpy.delete).toHaveBeenCalledWith("id-2");
		expect(sessionServiceSpy.delete).toHaveBeenCalledWith("id-3");
		expect(sessionServiceSpy.loadAll).toHaveBeenCalledTimes(1);
	});

	it("should call loadAll even when there are zero sessions", async () => {
		sessionServiceSpy._sessions.set([]);

		await useCase.execute();

		expect(sessionServiceSpy.delete).not.toHaveBeenCalled();
		expect(sessionServiceSpy.loadAll).toHaveBeenCalledTimes(1);
	});

	it("should propagate errors from delete to the caller", async () => {
		sessionServiceSpy._sessions.set([makeSession("id-1")]);
		sessionServiceSpy.delete.and.returnValue(Promise.reject(new Error("delete failed")));

		await expectAsync(useCase.execute()).toBeRejectedWithError("delete failed");
	});
});
