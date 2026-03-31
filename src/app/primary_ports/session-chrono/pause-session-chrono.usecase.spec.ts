import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { PauseSessionChronoUseCase } from "./pause-session-chrono.usecase";
import { SessionChronoService } from "../../core_logic/chrono/session-chrono.service";

describe("PauseSessionChronoUseCase — session-scoped API", () => {
	let useCase: PauseSessionChronoUseCase;
	let chronoService: SessionChronoService;

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
		});
		useCase = TestBed.inject(PauseSessionChronoUseCase);
		chronoService = TestBed.inject(SessionChronoService);
	});

	it("should delegate pause to SessionChronoService.pauseForSession", () => {
		spyOn(chronoService, "pauseForSession");

		useCase.pauseForSession("session-42");

		expect(chronoService.pauseForSession).toHaveBeenCalledOnceWith("session-42");
	});

	it("should delegate resume to SessionChronoService.resumeForSession", () => {
		spyOn(chronoService, "resumeForSession");

		useCase.resumeForSession("session-42");

		expect(chronoService.resumeForSession).toHaveBeenCalledOnceWith("session-42");
	});

	it("should delegate startForSession to SessionChronoService.startForSession", () => {
		spyOn(chronoService, "startForSession");

		useCase.startForSession("session-42");

		expect(chronoService.startForSession).toHaveBeenCalledOnceWith("session-42");
	});
});
