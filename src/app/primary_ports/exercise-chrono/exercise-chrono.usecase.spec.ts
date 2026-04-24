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
		settings: signal({ breakDuration: 60, repetitions: null, totalSets: null }),
		applyCustomSettings: jasmine.createSpy("applyCustomSettings"),
		restart: jasmine.createSpy("restart"),
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

describe('ExerciseChronoUseCase — applyCustomSettings and restart', () => {
	let useCase: ExerciseChronoUseCase;
	let serviceStub: ReturnType<typeof buildServiceStub>;

	beforeEach(() => {
		serviceStub = buildServiceStub();
		TestBed.configureTestingModule({
			providers: [ExerciseChronoUseCase, { provide: ExerciseChronoService, useValue: serviceStub }],
		});
		useCase = TestBed.inject(ExerciseChronoUseCase);
	});

	it('applyCustomSettings delegates to service.applyCustomSettings', () => {
		const s = { breakDuration: 90, repetitions: 3, totalSets: null };
		useCase.applyCustomSettings(s);
		expect(serviceStub.applyCustomSettings).toHaveBeenCalledOnceWith(s);
	});

	it('restart delegates to service.restart', () => {
		useCase.restart();
		expect(serviceStub.restart).toHaveBeenCalledTimes(1);
	});

	it('settings exposes the service settings signal', () => {
		expect(useCase.settings).toBe(serviceStub.settings);
	});
});
