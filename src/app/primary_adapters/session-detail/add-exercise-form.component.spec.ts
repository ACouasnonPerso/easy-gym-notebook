import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";
import { AddExerciseFormComponent } from "./add-exercise-form.component";
import { AddExerciseUseCase } from "../../primary_ports/session-detail/add-exercise.usecase";
import { AutocompleteService } from "../../core_logic/session-detail/autocomplete.service";
import { MuscleGroupDetectorService } from "../../core_logic/shared/muscle-group-detector.service";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { ANALYTICS_REPOSITORY } from "../../secondary_ports/analytics/analytics.repository.interface";

describe("AddExerciseFormComponent — pyramid toggle", () => {
	let fixture: ComponentFixture<AddExerciseFormComponent>;
	let component: AddExerciseFormComponent;
	let autocompleteSpy: jasmine.SpyObj<AutocompleteService>;
	let addUseCaseSpy: jasmine.SpyObj<AddExerciseUseCase>;

	beforeEach(async () => {
		autocompleteSpy = jasmine.createSpyObj("AutocompleteService", [
			"getSuggestions",
			"getDefaultsByExactName",
			"getLastParams",
		]);
		autocompleteSpy.getSuggestions.and.returnValue(Promise.resolve([]));
		autocompleteSpy.getDefaultsByExactName.and.returnValue(Promise.resolve(null));
		autocompleteSpy.getLastParams.and.returnValue(Promise.resolve(null));

		addUseCaseSpy = jasmine.createSpyObj("AddExerciseUseCase", ["execute"]);
		addUseCaseSpy.execute.and.returnValue(Promise.resolve());

		const exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);
		exerciseRepoSpy.save.and.returnValue(Promise.resolve());
		exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));
		exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		const sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		sessionRepoSpy.save.and.returnValue(Promise.resolve());
		sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		await TestBed.configureTestingModule({
			imports: [AddExerciseFormComponent],
			providers: [
				{ provide: AutocompleteService, useValue: autocompleteSpy },
				{ provide: AddExerciseUseCase, useValue: addUseCaseSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{
					provide: ANALYTICS_REPOSITORY,
					useValue: (() => {
						const s = jasmine.createSpyObj("IAnalyticsRepo", [
							"trackSessionStarted",
							"trackSessionUpdated",
							"trackSessionCompleted",
						]);
						s.trackSessionStarted.and.returnValue(Promise.resolve());
						s.trackSessionUpdated.and.returnValue(Promise.resolve());
						s.trackSessionCompleted.and.returnValue(Promise.resolve());
						return s;
					})(),
				},
				provideTranslateService({ defaultLanguage: "fr" }),
			],
		})
			.overrideComponent(AddExerciseFormComponent, {
				set: { providers: [] },
			})
			.compileComponents();

		fixture = TestBed.createComponent(AddExerciseFormComponent);
		fixture.componentRef.setInput("sessionId", "session-1");
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should hide the pyramid toggle when the current exercise is a cardio exercise", async () => {
		await component.onNameInput({ target: { value: "course à pied" } } as unknown as Event);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector(".pyramid-toggle")).toBeNull();
	});

	it("should show the pyramid toggle when the current exercise is a strength exercise", () => {
		component.isCardio.set(false);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector(".pyramid-toggle")).not.toBeNull();
	});

	it("should show the individual set rows and hide the standard weight, sets and reps pickers when the user activates pyramid mode", () => {
		component.isCardio.set(false);
		component.isPyramid.set(false);
		component.pyramidSets.set([
			{ weightKg: 60, reps: 12 },
			{ weightKg: 80, reps: 8 },
		]);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const toggleBtn = el.querySelector(".pyramid-toggle") as HTMLButtonElement;
		toggleBtn.click();
		fixture.detectChanges();

		expect(el.querySelector(".pyramid-sets")).not.toBeNull();
		expect(el.querySelector(".standard-pickers")).toBeNull();
	});

	it("should show the standard weight, sets and reps pickers and hide the set rows when the user deactivates pyramid mode", () => {
		component.isCardio.set(false);
		component.isPyramid.set(true);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const toggleBtn = el.querySelector(".pyramid-toggle") as HTMLButtonElement;
		toggleBtn.click();
		fixture.detectChanges();

		expect(el.querySelector(".standard-pickers")).not.toBeNull();
		expect(el.querySelector(".pyramid-sets")).toBeNull();
	});

	it("should block submission when the user activates pyramid mode and has not added any set rows", () => {
		component.name.set("Squat");
		component.isCardio.set(false);
		component.isPyramid.set(true);
		component.pyramidSets.set([]);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const submitBtn = el.querySelector(".btn-submit") as HTMLButtonElement;
		expect(submitBtn.disabled).toBeTrue();
	});

	it("should include pyramid mode as active and all set row data in the submitted exercise when the user submits a pyramid exercise", async () => {
		component.name.set("Squat");
		component.isCardio.set(false);
		component.isPyramid.set(true);
		component.pyramidSets.set([
			{ weightKg: 60, reps: 12 },
			{ weightKg: 80, reps: 8 },
		]);

		await component.onSubmit();

		expect(addUseCaseSpy.execute).toHaveBeenCalledOnceWith(
			jasmine.objectContaining({
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 60, reps: 12 },
					{ weightKg: 80, reps: 8 },
				],
			})
		);
	});

	it("should restore pyramid mode and all set rows when an autocomplete suggestion is selected and that exercise was previously recorded as a pyramid exercise", async () => {
		autocompleteSpy.getLastParams.and.returnValue(
			Promise.resolve({
				weightKg: 80,
				sets: 3,
				reps: 8,
				breakDurationSeconds: 120,
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 60, reps: 12 },
					{ weightKg: 80, reps: 8 },
				],
			})
		);

		await component.onSuggestionSelect("Squat");

		expect(component.isPyramid()).toBeTrue();
		expect(component.pyramidSets()).toEqual([
			{ weightKg: 60, reps: 12 },
			{ weightKg: 80, reps: 8 },
		]);
	});
});

describe("AddExerciseFormComponent — onSuggestionSelect", () => {
	let component: AddExerciseFormComponent;
	let autocompleteSpy: jasmine.SpyObj<AutocompleteService>;

	beforeEach(() => {
		autocompleteSpy = jasmine.createSpyObj("AutocompleteService", [
			"getSuggestions",
			"getDefaultsByExactName",
			"getLastParams",
		]);
		autocompleteSpy.getLastParams.and.returnValue(Promise.resolve(null));

		const exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);
		exerciseRepoSpy.save.and.returnValue(Promise.resolve());
		exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));
		exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		const sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		sessionRepoSpy.save.and.returnValue(Promise.resolve());
		sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		TestBed.configureTestingModule({
			imports: [AddExerciseFormComponent],
			providers: [
				{ provide: AutocompleteService, useValue: autocompleteSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{
					provide: ANALYTICS_REPOSITORY,
					useValue: (() => {
						const s = jasmine.createSpyObj("IAnalyticsRepo", [
							"trackSessionStarted",
							"trackSessionUpdated",
							"trackSessionCompleted",
						]);
						s.trackSessionStarted.and.returnValue(Promise.resolve());
						s.trackSessionUpdated.and.returnValue(Promise.resolve());
						s.trackSessionCompleted.and.returnValue(Promise.resolve());
						return s;
					})(),
				},
				provideTranslateService({ defaultLanguage: "fr" }),
			],
		}).overrideComponent(AddExerciseFormComponent, {
			set: { providers: [] },
		});

		const fixture = TestBed.createComponent(AddExerciseFormComponent);
		fixture.componentRef.setInput("sessionId", "session-1");
		component = fixture.componentInstance;
	});

	it("should set the name signal to the selected suggestion", async () => {
		await component.onSuggestionSelect("Développé couché");

		expect(component.name()).toBe("Développé couché");
	});

	it("should clear the suggestions list after selecting a suggestion", async () => {
		component.suggestions.set(["Développé couché", "Développé incliné"]);

		await component.onSuggestionSelect("Développé couché");

		expect(component.suggestions()).toEqual([]);
	});

	it("should keep the current params when no history exists for the selected suggestion", async () => {
		autocompleteSpy.getLastParams.and.returnValue(Promise.resolve(null));
		component.weightKg.set(60);
		component.sets.set(3);
		component.reps.set(10);
		component.breakDurationSeconds.set(90);

		await component.onSuggestionSelect("Exercice inconnu");

		expect(component.weightKg()).toBe(60);
		expect(component.sets()).toBe(3);
		expect(component.reps()).toBe(10);
		expect(component.breakDurationSeconds()).toBe(90);
	});

	it("should set all four params from history when history exists for the selected suggestion", async () => {
		autocompleteSpy.getLastParams.and.returnValue(
			Promise.resolve({
				weightKg: 80,
				sets: 5,
				reps: 8,
				breakDurationSeconds: 180,
			})
		);

		await component.onSuggestionSelect("Squat");

		expect(component.weightKg()).toBe(80);
		expect(component.sets()).toBe(5);
		expect(component.reps()).toBe(8);
		expect(component.breakDurationSeconds()).toBe(180);
	});

	it("should call getLastParams with the exact selected suggestion name", async () => {
		await component.onSuggestionSelect("Curl biceps");

		expect(autocompleteSpy.getLastParams).toHaveBeenCalledOnceWith("Curl biceps");
	});
});

describe("AddExerciseFormComponent — pyramid pre-fill on activation", () => {
	let fixture: ComponentFixture<AddExerciseFormComponent>;
	let component: AddExerciseFormComponent;
	let autocompleteSpy: jasmine.SpyObj<AutocompleteService>;

	beforeEach(async () => {
		autocompleteSpy = jasmine.createSpyObj("AutocompleteService", [
			"getSuggestions",
			"getDefaultsByExactName",
			"getLastParams",
		]);
		autocompleteSpy.getSuggestions.and.returnValue(Promise.resolve([]));
		autocompleteSpy.getDefaultsByExactName.and.returnValue(Promise.resolve(null));
		autocompleteSpy.getLastParams.and.returnValue(Promise.resolve(null));

		const addUseCaseSpy = jasmine.createSpyObj("AddExerciseUseCase", ["execute"]);
		addUseCaseSpy.execute.and.returnValue(Promise.resolve());

		const exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);
		exerciseRepoSpy.save.and.returnValue(Promise.resolve());
		exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));
		exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		const sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		sessionRepoSpy.save.and.returnValue(Promise.resolve());
		sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		await TestBed.configureTestingModule({
			imports: [AddExerciseFormComponent],
			providers: [
				{ provide: AutocompleteService, useValue: autocompleteSpy },
				{ provide: AddExerciseUseCase, useValue: addUseCaseSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{
					provide: ANALYTICS_REPOSITORY,
					useValue: (() => {
						const s = jasmine.createSpyObj("IAnalyticsRepo", [
							"trackSessionStarted",
							"trackSessionUpdated",
							"trackSessionCompleted",
						]);
						s.trackSessionStarted.and.returnValue(Promise.resolve());
						s.trackSessionUpdated.and.returnValue(Promise.resolve());
						s.trackSessionCompleted.and.returnValue(Promise.resolve());
						return s;
					})(),
				},
				provideTranslateService({ defaultLanguage: "fr" }),
			],
		})
			.overrideComponent(AddExerciseFormComponent, {
				set: { providers: [] },
			})
			.compileComponents();

		fixture = TestBed.createComponent(AddExerciseFormComponent);
		fixture.componentRef.setInput("sessionId", "session-1");
		component = fixture.componentInstance;
		component.isCardio.set(false);
		component.isPyramid.set(false);
		component.pyramidSets.set([]);
		fixture.detectChanges();
	});

	it("should generate exactly as many pyramid rows as the current sets count when pyramid mode is activated", () => {
		component.sets.set(5);
		component.weightKg.set(31);

		component.togglePyramid();

		expect(component.pyramidSets().length).toBe(5);
	});

	it("should pre-fill every generated pyramid row with the currently selected weight when pyramid mode is activated", () => {
		component.sets.set(5);
		component.weightKg.set(31);

		component.togglePyramid();

		const allWeights = component.pyramidSets().map((s) => s.weightKg);
		expect(allWeights).toEqual([31, 31, 31, 31, 31]);
	});

	it("should not overwrite existing pyramid sets when pyramid mode is re-activated after being deactivated", () => {
		component.sets.set(5);
		component.weightKg.set(31);
		component.pyramidSets.set([
			{ weightKg: 60, reps: 12 },
			{ weightKg: 80, reps: 8 },
		]);
		component.isPyramid.set(true);

		// deactivate then reactivate
		component.togglePyramid(); // now isPyramid = false
		component.togglePyramid(); // now isPyramid = true again, sets already exist

		expect(component.pyramidSets()).toEqual([
			{ weightKg: 60, reps: 12 },
			{ weightKg: 80, reps: 8 },
		]);
	});
});

describe("AddExerciseFormComponent — cardio layout", () => {
	let fixture: ComponentFixture<AddExerciseFormComponent>;
	let component: AddExerciseFormComponent;
	let autocompleteSpy: jasmine.SpyObj<AutocompleteService>;

	beforeEach(async () => {
		autocompleteSpy = jasmine.createSpyObj("AutocompleteService", [
			"getSuggestions",
			"getDefaultsByExactName",
			"getLastParams",
		]);
		autocompleteSpy.getSuggestions.and.returnValue(Promise.resolve([]));
		autocompleteSpy.getDefaultsByExactName.and.returnValue(Promise.resolve(null));
		autocompleteSpy.getLastParams.and.returnValue(Promise.resolve(null));

		const exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);
		exerciseRepoSpy.save.and.returnValue(Promise.resolve());
		exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));
		exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		const sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		sessionRepoSpy.save.and.returnValue(Promise.resolve());
		sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		await TestBed.configureTestingModule({
			imports: [AddExerciseFormComponent],
			providers: [
				{ provide: AutocompleteService, useValue: autocompleteSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{
					provide: ANALYTICS_REPOSITORY,
					useValue: (() => {
						const s = jasmine.createSpyObj("IAnalyticsRepo", [
							"trackSessionStarted",
							"trackSessionUpdated",
							"trackSessionCompleted",
						]);
						s.trackSessionStarted.and.returnValue(Promise.resolve());
						s.trackSessionUpdated.and.returnValue(Promise.resolve());
						s.trackSessionCompleted.and.returnValue(Promise.resolve());
						return s;
					})(),
				},
				provideTranslateService({ defaultLanguage: "fr" }),
			],
		})
			.overrideComponent(AddExerciseFormComponent, {
				set: { providers: [] },
			})
			.compileComponents();

		fixture = TestBed.createComponent(AddExerciseFormComponent);
		fixture.componentRef.setInput("sessionId", "session-1");
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should switch pickers row to cardio layout when a cardio name is entered", async () => {
		await component.onNameInput({ target: { value: "course à pied" } } as unknown as Event);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const pickerLabels = Array.from(el.querySelectorAll(".picker-label")).map((l) =>
			(l as HTMLElement).textContent?.trim()
		);
		expect(
			pickerLabels.some((l) => l?.toLowerCase().includes("heure") || l?.toLowerCase().includes("minute"))
		).toBeTrue();
		expect(
			pickerLabels.some((l) => l?.toLowerCase().includes("weight") || l?.toLowerCase().includes("poids"))
		).toBeFalse();
	});

	it("should disable submit button when durationSeconds is 0 in cardio mode", async () => {
		await component.onNameInput({ target: { value: "course à pied" } } as unknown as Event);
		component.durationHours.set(0);
		component.durationMinutes.set(0);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const submitBtn = el.querySelector(".btn-submit") as HTMLButtonElement;
		expect(submitBtn.disabled).toBeTrue();
	});
});
