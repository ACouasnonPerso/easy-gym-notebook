import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { GetSessionChronoUseCase } from "./get-session-chrono.usecase";
import { SessionChronoService } from "../../core_logic/chrono/session-chrono.service";

describe("GetSessionChronoUseCase — forSession()", () => {
	let useCase: GetSessionChronoUseCase;
	let chronoService: SessionChronoService;

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
		});
		useCase = TestBed.inject(GetSessionChronoUseCase);
		chronoService = TestBed.inject(SessionChronoService);
		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(0));
	});

	afterEach(() => {
		jasmine.clock().uninstall();
	});

	it("should return elapsed signal for the given session id", () => {
		chronoService.startForSession("s1");
		jasmine.clock().tick(5000);

		const elapsed = useCase.getElapsedForSession("s1");

		expect(elapsed()).toBe(5);
	});

	it("should return status signal for the given session id", () => {
		chronoService.startForSession("s1");

		const status = useCase.getStatusForSession("s1");

		expect(status()).toBe("running");

		chronoService.pauseForSession("s1");

		expect(status()).toBe("paused");
	});
});
