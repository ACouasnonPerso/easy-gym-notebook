import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { ExerciseChronoUseCase } from "./exercise-chrono.usecase";
import { ExerciseChronoService } from "../../core_logic/exercise-chrono/exercise-chrono.service";

function buildServiceStub() {
	return {
		chronoState: signal<string>("initial"),
		timeSeconds: signal(0),
		seriesCount: signal(0),
		soundEnabled: signal(true),
		mode: signal<string>("exercise"),
		init: jasmine.createSpy("init"),
		updateBreakDuration: jasmine.createSpy("updateBreakDuration"),
		start: jasmine.createSpy("start"),
		pause: jasmine.createSpy("pause"),
		resume: jasmine.createSpy("resume"),
		goBreak: jasmine.createSpy("goBreak"),
		goTraining: jasmine.createSpy("goTraining"),
		reset: jasmine.createSpy("reset"),
		toggleSound: jasmine.createSpy("toggleSound"),
		addTime: jasmine.createSpy("addTime"),
		incrementSeriesCount: jasmine.createSpy("incrementSeriesCount"),
		decrementSeriesCount: jasmine.createSpy("decrementSeriesCount"),
	};
}

describe("ExerciseChronoUseCase — addTime", () => {
	let useCase: ExerciseChronoUseCase;
	let serviceStub: ReturnType<typeof buildServiceStub>;

	beforeEach(() => {
		serviceStub = buildServiceStub();
		TestBed.configureTestingModule({
			providers: [ExerciseChronoUseCase, { provide: ExerciseChronoService, useValue: serviceStub }],
		});
		useCase = TestBed.inject(ExerciseChronoUseCase);
	});

	it("délègue addTime(15) au service", () => {
		useCase.addTime(15);

		expect(serviceStub.addTime).toHaveBeenCalledOnceWith(15);
	});

	it("délègue addTime(30) au service", () => {
		useCase.addTime(30);

		expect(serviceStub.addTime).toHaveBeenCalledOnceWith(30);
	});
});
