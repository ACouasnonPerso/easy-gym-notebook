import { TestBed, ComponentFixture, fakeAsync, tick } from "@angular/core/testing";
import { provideTranslateService } from "@ngx-translate/core";
import { ExerciseExpandedComponent } from "./exercise-expanded.component";
import { MassUnitService, MassUnit } from "../../core_logic/mass-unit/mass-unit.service";
import { Exercise } from "../../core_logic/shared/models";
import { ExercisePhotoStore } from "../../stores/exercise-photo.store";
import { SetExercisePhotoUseCase } from "../../primary_ports/exercise-photo/set-exercise-photo.usecase";
import { RemoveExercisePhotoUseCase } from "../../primary_ports/exercise-photo/remove-exercise-photo.usecase";
import { GetExercisePhotoUseCase } from "../../primary_ports/exercise-photo/get-exercise-photo.usecase";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Bench Press",
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 85,
		sets: 3,
		reps: 10,
		breakDurationSeconds: 60,
		durationSeconds: 0,
		status: "pending",
		isCardio: false,
		isPyramid: false,
		pyramidSets: [],
		distanceKm: null,
		rating: null,
		comment: null,
		...overrides,
	} as Exercise;
}
function createPhotoStore(): ExercisePhotoStore { return new ExercisePhotoStore(); }

function makePhotoProviders() {
	return [
		{ provide: ExercisePhotoStore, useFactory: createPhotoStore },
		{ provide: SetExercisePhotoUseCase, useValue: jasmine.createSpyObj("SetExercisePhotoUseCase", ["execute"]) },
		{ provide: RemoveExercisePhotoUseCase, useValue: jasmine.createSpyObj("RemoveExercisePhotoUseCase", ["execute"]) },
		{ provide: GetExercisePhotoUseCase, useValue: jasmine.createSpyObj("GetExercisePhotoUseCase", ["photoFor"]) },
	];
}


describe("ExerciseExpandedComponent — btn-rating rated state", () => {
	let fixture: ComponentFixture<ExerciseExpandedComponent>;

	beforeEach(async () => {
		localStorage.clear();

		await TestBed.configureTestingModule({
			imports: [ExerciseExpandedComponent],
			providers: [MassUnitService, provideTranslateService({ defaultLanguage: "fr" }), ...makePhotoProviders()],
		}).compileComponents();

		TestBed.inject(MassUnitService).setMassUnit("metric");
	});

	it("should NOT have btn-rating--rated class when rating is null", () => {
		fixture = TestBed.createComponent(ExerciseExpandedComponent);
		fixture.componentRef.setInput("exercise", makeExercise({ rating: null }));
		fixture.detectChanges();

		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-rating");
		expect(btn.classList.contains("btn-rating--rated")).toBeFalse();
	});

	it("should have btn-rating--rated class when a rating is assigned", () => {
		fixture = TestBed.createComponent(ExerciseExpandedComponent);
		fixture.componentRef.setInput("exercise", makeExercise({ rating: 4 }));
		fixture.detectChanges();

		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-rating");
		expect(btn.classList.contains("btn-rating--rated")).toBeTrue();
	});
});

describe("ExerciseExpandedComponent — togglePyramid pre-fill", () => {
	let fixture: ComponentFixture<ExerciseExpandedComponent>;
	let component: ExerciseExpandedComponent;
	let massUnitService: MassUnitService;

	beforeEach(async () => {
		localStorage.clear();

		await TestBed.configureTestingModule({
			imports: [ExerciseExpandedComponent],
			providers: [MassUnitService, provideTranslateService({ defaultLanguage: "fr" }), ...makePhotoProviders()],
		}).compileComponents();

		massUnitService = TestBed.inject(MassUnitService);
		massUnitService.setMassUnit("metric");
	});

	it("should generate as many pyramid sets as the exercise sets count, each pre-filled with current weight", () => {
		fixture = TestBed.createComponent(ExerciseExpandedComponent);
		fixture.componentRef.setInput("exercise", makeExercise({ weightKg: 31, sets: 5, pyramidSets: [] }));
		fixture.detectChanges();
		component = fixture.componentInstance;

		component.togglePyramid();

		const sets = component.effectivePyramidSets();
		expect(sets.length).toBe(5);
		sets.forEach((s) => expect(s.weightKg).toBe(31));
	});
});

describe("ExerciseExpandedComponent — weight unit conversion", () => {
	let fixture: ComponentFixture<ExerciseExpandedComponent>;
	let component: ExerciseExpandedComponent;
	let massUnitService: MassUnitService;

	function setUnit(unit: MassUnit): void {
		massUnitService.setMassUnit(unit);
		fixture.detectChanges();
	}

	beforeEach(async () => {
		localStorage.clear();

		await TestBed.configureTestingModule({
			imports: [ExerciseExpandedComponent],
			providers: [MassUnitService, provideTranslateService({ defaultLanguage: "fr" }), ...makePhotoProviders()],
		}).compileComponents();

		massUnitService = TestBed.inject(MassUnitService);
		massUnitService.setMassUnit("metric");

		fixture = TestBed.createComponent(ExerciseExpandedComponent);
		fixture.componentRef.setInput("exercise", makeExercise());
		fixture.detectChanges();
		component = fixture.componentInstance;
	});

	describe("weightValuesForDisplay", () => {
		it("should return raw kg values when system is metric", () => {
			setUnit("metric");

			const values = component.weightValuesForDisplay();

			expect(values[0]).toBe(0);
			expect(values).toContain(85);
			expect(values).toContain(30);
		});

		it("should return a dedicated integer lb list when system is US", () => {
			setUnit("us");

			const values = component.weightValuesForDisplay();

			// Must contain integer lb values
			expect(values).toContain(134);
			expect(values).toContain(135);
			expect(values).toContain(136);
			// Must NOT contain decimal kg-converted values like 187.4
			expect(values).not.toContain(187.4);
			// Must not contain non-integer decimals from kg conversion
			const hasDecimals = (values as number[]).some(
				(v) => v !== Math.floor(v as number) && v !== Math.ceil(v as number)
			);
			expect(hasDecimals).toBeFalse();
		});

		it("should return a dedicated integer lb list when system is imperial", () => {
			setUnit("imperial");

			const values = component.weightValuesForDisplay();

			expect(values).toContain(134);
			expect(values).toContain(135);
			expect(values).not.toContain(187.4);
		});
	});

	describe("weightSelectedValue", () => {
		it("should return exercise weightKg as-is when system is metric", () => {
			setUnit("metric");

			expect(component.weightSelectedValue()).toBe(85);
		});

		it("should return the nearest integer lb value when system is US", () => {
			setUnit("us");

			// 85 kg * 2.20462 = 187.39... lb -> nearest integer = 187
			const selected = component.weightSelectedValue();
			expect(selected).toBe(187);
			expect(Number.isInteger(selected as number)).toBeTrue();
		});

		it("should return the nearest integer lb value when system is imperial", () => {
			setUnit("imperial");

			const selected = component.weightSelectedValue();
			expect(selected).toBe(187);
			expect(Number.isInteger(selected as number)).toBeTrue();
		});
	});

	describe("emitWeightUpdate", () => {
		it("should emit weightKg unchanged when system is metric", () => {
			setUnit("metric");
			const emitted: Partial<Exercise>[] = [];
			fixture.componentRef.instance.update.subscribe((v: Partial<Exercise>) => emitted.push(v));

			component.emitWeightUpdate(85);

			expect(emitted[0]).toEqual({ weightKg: 85 });
		});

		it("should convert lb back to kg before emitting when system is US", () => {
			setUnit("us");
			const emitted: Partial<Exercise>[] = [];
			fixture.componentRef.instance.update.subscribe((v: Partial<Exercise>) => emitted.push(v));

			// User picks 187.4 lb — should be stored as 85 kg
			component.emitWeightUpdate(187.4);

			const emittedKg = emitted[0].weightKg!;
			expect(emittedKg).toBeCloseTo(85, 1);
		});

		it("should convert lb back to kg before emitting when system is imperial", () => {
			setUnit("imperial");
			const emitted: Partial<Exercise>[] = [];
			fixture.componentRef.instance.update.subscribe((v: Partial<Exercise>) => emitted.push(v));

			component.emitWeightUpdate(187.4);

			const emittedKg = emitted[0].weightKg!;
			expect(emittedKg).toBeCloseTo(85, 1);
		});
	});
});
describe("ExerciseExpandedComponent — photo button", () => {
	let fixture: ComponentFixture<ExerciseExpandedComponent>;
	let component: ExerciseExpandedComponent;
	let store: ExercisePhotoStore;
	let setPhotoSpy: jasmine.SpyObj<SetExercisePhotoUseCase>;
	let removePhotoSpy: jasmine.SpyObj<RemoveExercisePhotoUseCase>;

	beforeEach(async () => {
		localStorage.clear();
		setPhotoSpy = jasmine.createSpyObj<SetExercisePhotoUseCase>("SetExercisePhotoUseCase", ["execute"]);
		setPhotoSpy.execute.and.returnValue(Promise.resolve());
		removePhotoSpy = jasmine.createSpyObj<RemoveExercisePhotoUseCase>("RemoveExercisePhotoUseCase", ["execute"]);
		removePhotoSpy.execute.and.returnValue(Promise.resolve());
		store = new ExercisePhotoStore();
		await TestBed.configureTestingModule({
			imports: [ExerciseExpandedComponent],
			providers: [
				MassUnitService,
				provideTranslateService({ defaultLanguage: "fr" }),
				{ provide: ExercisePhotoStore, useValue: store },
				{ provide: SetExercisePhotoUseCase, useValue: setPhotoSpy },
				{ provide: RemoveExercisePhotoUseCase, useValue: removePhotoSpy },
				GetExercisePhotoUseCase,
			],
		}).compileComponents();
		TestBed.inject(MassUnitService).setMassUnit("metric");
	});

	function createFixture(overrides: Partial<Exercise> = {}): void {
		fixture = TestBed.createComponent(ExerciseExpandedComponent);
		fixture.componentRef.setInput("exercise", makeExercise(overrides));
		fixture.detectChanges();
		component = fixture.componentInstance;
	}
	it("should render a photo button in the actions row", () => {
		createFixture();
		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo");
		expect(btn).toBeTruthy();
	});

	it("should show btn-photo--no-photo class when no photo is set", () => {
		createFixture();
		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo");
		expect(btn.classList.contains("btn-photo--no-photo")).toBeTrue();
		expect(btn.classList.contains("btn-photo--has-photo")).toBeFalse();
	});

	it("should show btn-photo--has-photo class when a photo exists for this exercise", () => {
		store.setForName("Bench Press", { exerciseName: "Bench Press", dataUrl: "data:image/jpeg;base64,abc", capturedAt: new Date() });
		createFixture();
		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo");
		expect(btn.classList.contains("btn-photo--has-photo")).toBeTrue();
		expect(btn.classList.contains("btn-photo--no-photo")).toBeFalse();
	});

	it("should disable the photo button when exercise name is empty", () => {
		createFixture({ name: "" });
		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo");
		expect(btn.disabled).toBeTrue();
	});

	it("should disable the photo button when exercise name is whitespace-only", () => {
		createFixture({ name: "   " });
		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo");
		expect(btn.disabled).toBeTrue();
	});

	it("should enable the photo button when exercise name is non-empty", () => {
		createFixture({ name: "Squat" });
		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo");
		expect(btn.disabled).toBeFalse();
	});

	it("should have a hidden file input with accept=image/* and capture attribute", () => {
		createFixture();
		const input: HTMLInputElement = fixture.nativeElement.querySelector("input[type=file]");
		expect(input).toBeTruthy();
		expect(input.accept).toBe("image/*");
		expect(input.hasAttribute("capture")).toBeTrue();
	});

	it("should click the hidden file input when photo button is tapped", () => {
		createFixture();
		const input: HTMLInputElement = fixture.nativeElement.querySelector("input[type=file]");
		const clickSpy = spyOn(input, "click");
		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo");
		btn.click();
		expect(clickSpy).toHaveBeenCalled();
	});

	it("should call SetExercisePhotoUseCase with exercise name and file on file change", fakeAsync(async () => {
		createFixture({ name: "Bench Press" });
		const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
		await component.onFileSelected(file);
		tick();
		expect(setPhotoSpy.execute).toHaveBeenCalledWith("Bench Press", file);
	}));

	it("should not show toast on successful photo set", fakeAsync(async () => {
		createFixture();
		const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
		await component.onFileSelected(file);
		tick();
		fixture.detectChanges();
		expect(component.toastVisible()).toBeFalse();
	}));

	it("should show error toast when SetExercisePhotoUseCase throws", fakeAsync(async () => {
		setPhotoSpy.execute.and.returnValue(Promise.reject(new Error("fail")));
		createFixture();
		const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
		await component.onFileSelected(file).catch(() => {});
		tick();
		fixture.detectChanges();
		expect(component.toastVisible()).toBeTrue();
		expect(component.toastType()).toBe("error");
	}));

	it("should show a remove button when a photo exists", () => {
		store.setForName("Bench Press", { exerciseName: "Bench Press", dataUrl: "data:image/jpeg;base64,abc", capturedAt: new Date() });
		createFixture();
		const removeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo-remove");
		expect(removeBtn).toBeTruthy();
	});

	it("should NOT show a remove button when no photo exists", () => {
		createFixture();
		const removeBtn = fixture.nativeElement.querySelector(".btn-photo-remove");
		expect(removeBtn).toBeNull();
	});

	it("should show confirm dialog when remove button is clicked", () => {
		store.setForName("Bench Press", { exerciseName: "Bench Press", dataUrl: "data:image/jpeg;base64,abc", capturedAt: new Date() });
		createFixture();
		const removeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(".btn-photo-remove");
		removeBtn.click();
		fixture.detectChanges();
		expect(component.showRemoveConfirm()).toBeTrue();
		const dialog = fixture.nativeElement.querySelector("app-confirm-dialog");
		expect(dialog).toBeTruthy();
	});

	it("should call RemoveExercisePhotoUseCase when remove is confirmed", fakeAsync(async () => {
		store.setForName("Bench Press", { exerciseName: "Bench Press", dataUrl: "data:image/jpeg;base64,abc", capturedAt: new Date() });
		createFixture({ name: "Bench Press" });
		component.showRemoveConfirm.set(true);
		await component.onRemoveConfirmed();
		tick();
		expect(removePhotoSpy.execute).toHaveBeenCalledWith("Bench Press");
		expect(component.showRemoveConfirm()).toBeFalse();
	}));

	it("should hide the confirm dialog on remove cancel", () => {
		createFixture();
		component.showRemoveConfirm.set(true);
		component.showRemoveConfirm.set(false);
		fixture.detectChanges();
		const dialog = fixture.nativeElement.querySelector("app-confirm-dialog");
		expect(dialog).toBeNull();
	});

	it("should reset toastVisible to false when toast dismissed event fires", fakeAsync(async () => {
		setPhotoSpy.execute.and.returnValue(Promise.reject(new Error("fail")));
		createFixture();
		const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
		await component.onFileSelected(file).catch(() => {});
		tick();
		fixture.detectChanges();
		component.onToastDismissed();
		expect(component.toastVisible()).toBeFalse();
	}));
});