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

describe("ExerciseChronoUseCase Story 3 - settings, applyCustomSettings, restart", () => {
	let useCase: ExerciseChronoUseCase;
	let serviceStub: ReturnType<typeof buildServiceStub>;

	function buildServiceStubWithExtras() {
		const base = buildServiceStub();
		return {
			...base,
			settings: signal({ exerciseDuration: null, breakDuration: 60, repetitions: null }),
			completedReps: signal(0),
			applyCustomSettings: jasmine.createSpy("applyCustomSettings"),
			restart: jasmine.createSpy("restart"),
		};
	}

	beforeEach(() => {
		serviceStub = buildServiceStubWithExtras() as any;
		TestBed.configureTestingModule({
			providers: [ExerciseChronoUseCase, { provide: ExerciseChronoService, useValue: serviceStub }],
		});
		useCase = TestBed.inject(ExerciseChronoUseCase);
	});

	it("exposes settings signal from service", () => {
		expect(useCase.settings).toBeDefined();
		expect(useCase.settings()).toEqual({ exerciseDuration: null, breakDuration: 60, repetitions: null });
	});

	it("applyCustomSettings delegates to service", () => {
		const s = { exerciseDuration: 30, breakDuration: 60, repetitions: 3 };
		useCase.applyCustomSettings(s);
		expect((serviceStub as any).applyCustomSettings).toHaveBeenCalledOnceWith(s);
	});

	it("restart delegates to service", () => {
		useCase.restart();
		expect((serviceStub as any).restart).toHaveBeenCalledTimes(1);
	});
});
