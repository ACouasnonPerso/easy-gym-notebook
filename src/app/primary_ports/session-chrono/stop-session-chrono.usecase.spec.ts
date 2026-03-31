import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { Router } from "@angular/router";
import { StopSessionChronoUseCase } from "./stop-session-chrono.usecase";
import { SessionChronoService } from "../../core_logic/chrono/session-chrono.service";
import { SessionService } from "../../core_logic/session/session.service";

describe("StopSessionChronoUseCase — executeForSession()", () => {
	let useCase: StopSessionChronoUseCase;
	let chronoServiceSpy: jasmine.SpyObj<SessionChronoService>;
	let sessionServiceSpy: jasmine.SpyObj<SessionService>;

	beforeEach(() => {
		localStorage.clear();
		chronoServiceSpy = jasmine.createSpyObj("SessionChronoService", ["stopForSession", "stop"]);
		sessionServiceSpy = jasmine.createSpyObj("SessionService", ["updateCurrentSession"]);
		sessionServiceSpy.updateCurrentSession.and.returnValue(Promise.resolve());

		TestBed.configureTestingModule({
			providers: [
				{ provide: PLATFORM_ID, useValue: "browser" },
				{ provide: SessionChronoService, useValue: chronoServiceSpy },
				{ provide: SessionService, useValue: sessionServiceSpy },
				{ provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
			],
		});
		useCase = TestBed.inject(StopSessionChronoUseCase);
	});

	it("should call stopForSession with the given sessionId and update session if elapsed > 0", async () => {
		chronoServiceSpy.stopForSession.and.returnValue(120);

		await useCase.executeForSession("session-42");

		expect(chronoServiceSpy.stopForSession).toHaveBeenCalledOnceWith("session-42");
		expect(sessionServiceSpy.updateCurrentSession).toHaveBeenCalledOnceWith({
			durationSeconds: 120,
			status: "completed",
		});
	});

	it("should not call updateCurrentSession when elapsed is 0", async () => {
		chronoServiceSpy.stopForSession.and.returnValue(0);

		await useCase.executeForSession("session-42");

		expect(sessionServiceSpy.updateCurrentSession).not.toHaveBeenCalled();
	});
});
