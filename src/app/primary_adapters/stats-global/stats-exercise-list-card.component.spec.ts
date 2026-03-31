import { TestBed } from "@angular/core/testing";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { StatsExerciseListCardComponent } from "./stats-exercise-list-card.component";
import { ExerciseSummary } from "../../core_logic/stats-global/stats.service";
import { MuscleGroup } from "../../core_logic/shared/models";

const TRANSLATIONS = {
	common: {
		exercises: "Exercices",
		merge: "Fusionner",
		cardio: "Cardio",
		cancel: "Annuler",
		confirm: "Confirmer",
	},
	statsGlobal: {
		newNamePlaceholder: "Nouveau nom",
		mergeCount: "Fusionner ({{ count }})",
		confirmMergeTitle: "Confirmer la fusion",
		confirmMergeBody: "",
	},
	muscleGroups: {
		Chest: "Chest",
		Back: "Back",
		Shoulders: "Shoulders",
		Biceps: "Biceps",
		Triceps: "Triceps",
		Forearms: "Forearms",
		Abs: "Abs",
		Quads: "Quads",
		Hamstrings: "Hamstrings",
		Glutes: "Glutes",
		Calves: "Calves",
		Traps: "Traps",
		Adductors: "Adductors",
		Abductors: "Abductors",
	},
};

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of(TRANSLATIONS as unknown as TranslationObject);
	}
}

const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n() {
	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");
}

function makeExercise(overrides: Partial<ExerciseSummary> = {}): ExerciseSummary {
	return {
		name: "Exercice",
		maxWeightKg: 0,
		totalVolumeKg: 0,
		occurrenceCount: 1,
		isCardio: false,
		totalDurationSeconds: 0,
		totalDistanceKm: null,
		muscleGroups: [],
		...overrides,
	};
}

describe("StatsExerciseListCardComponent — tag chip colors", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<StatsExerciseListCardComponent>>;

	function setup(exercises: ExerciseSummary[]) {
		TestBed.configureTestingModule({
			imports: [StatsExerciseListCardComponent, translateModuleConfig],
		});
		setupI18n();
		fixture = TestBed.createComponent(StatsExerciseListCardComponent);
		fixture.componentRef.setInput("exercises", exercises);
		fixture.detectChanges();
	}

	// Test 1 — chip background color matches muscle group color
	it("doit appliquer la couleur du groupe musculaire en background sur le chip", () => {
		setup([makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest] })]);

		const el: HTMLElement = fixture.nativeElement;
		const chip = el.querySelector<HTMLElement>('[data-testid="tag-filter-chip"]')!;
		expect(chip).toBeTruthy();
		// Chest color from muscleColorMap: bg 'rgba(231,76,60,0.15)', border 'rgba(231,76,60,0.3)', color '#e74c3c'
		expect(chip.style.background).toContain("rgba(231");
		expect(chip.style.color).toBe("rgb(231, 76, 60)");
	});
});

describe("StatsExerciseListCardComponent — tag filter chips", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<StatsExerciseListCardComponent>>;

	function setup(exercises: ExerciseSummary[]) {
		TestBed.configureTestingModule({
			imports: [StatsExerciseListCardComponent, translateModuleConfig],
		});
		setupI18n();
		fixture = TestBed.createComponent(StatsExerciseListCardComponent);
		fixture.componentRef.setInput("exercises", exercises);
		fixture.detectChanges();
	}

	// Test 1 — no tags when exercises have no muscleGroups and are not cardio
	it("ne doit afficher aucun chip de tag quand les exercices n'ont pas de muscleGroups et ne sont pas cardio", () => {
		setup([
			makeExercise({ name: "Exercice inconnu A", isCardio: false, muscleGroups: [] }),
			makeExercise({ name: "Exercice inconnu B", isCardio: false, muscleGroups: [] }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const chips = el.querySelectorAll('[data-testid="tag-filter-chip"]');
		expect(chips.length).toBe(0);
	});

	// Test 2 — unique tag chips are rendered for all muscleGroups across exercises
	it("doit afficher un chip par tag unique parmi tous les exercices", () => {
		setup([
			makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest, MuscleGroup.Triceps] }),
			makeExercise({ name: "Curl biceps", muscleGroups: [MuscleGroup.Biceps] }),
			makeExercise({ name: "Curl biceps 2", muscleGroups: [MuscleGroup.Biceps] }), // dupliqué — ne doit apparaître qu'une fois
		]);

		const el: HTMLElement = fixture.nativeElement;
		const chips = el.querySelectorAll('[data-testid="tag-filter-chip"]');
		expect(chips.length).toBe(3); // Chest, Triceps, Biceps — pas de doublon
		const texts = Array.from(chips).map((c) => c.textContent?.trim());
		expect(texts).toContain(MuscleGroup.Chest);
		expect(texts).toContain(MuscleGroup.Triceps);
		expect(texts).toContain(MuscleGroup.Biceps);
	});

	// Test 3 — clicking a chip adds the "active" class to it
	it("doit marquer le chip comme actif après un clic", () => {
		setup([makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest] })]);

		const el: HTMLElement = fixture.nativeElement;
		const chip = el.querySelector<HTMLElement>('[data-testid="tag-filter-chip"]')!;
		expect(chip.classList.contains("active")).toBeFalse();

		chip.click();
		fixture.detectChanges();

		expect(chip.classList.contains("active")).toBeTrue();
	});

	// Test 4 — clicking an active chip deselects it (removes "active" class)
	it("doit désélectionner un chip actif après un second clic", () => {
		setup([makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest] })]);

		const el: HTMLElement = fixture.nativeElement;
		const chip = el.querySelector<HTMLElement>('[data-testid="tag-filter-chip"]')!;

		chip.click();
		fixture.detectChanges();
		expect(chip.classList.contains("active")).toBeTrue();

		chip.click();
		fixture.detectChanges();
		expect(chip.classList.contains("active")).toBeFalse();
	});

	// Test 5 — avec aucun tag sélectionné, tous les exercices sont affichés
	it("doit afficher tous les exercices quand aucun tag n'est sélectionné", () => {
		setup([
			makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest] }),
			makeExercise({ name: "Curl biceps", muscleGroups: [MuscleGroup.Biceps] }),
			makeExercise({ name: "Course", isCardio: true, muscleGroups: [] }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(3);
	});

	// Test 6 — avec un tag sélectionné, seuls les exercices correspondants sont affichés
	it("doit afficher uniquement les exercices correspondant au tag sélectionné", () => {
		setup([
			makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest] }),
			makeExercise({ name: "Curl biceps", muscleGroups: [MuscleGroup.Biceps] }),
			makeExercise({ name: "Course", isCardio: true, muscleGroups: [] }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const chips = el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]');
		const chestChip = Array.from(chips).find((c) => c.textContent?.trim() === MuscleGroup.Chest)!;
		chestChip.click();
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(1);
		expect(rows[0].getAttribute("ng-reflect-exercise-name")).toBe("Développé couché");
	});

	// Test 7 — avec deux tags sélectionnés, les exercices correspondant à au moins un tag sont affichés (union)
	it("doit afficher les exercices correspondant à au moins un des tags sélectionnés", () => {
		setup([
			makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest] }),
			makeExercise({ name: "Curl biceps", muscleGroups: [MuscleGroup.Biceps] }),
			makeExercise({ name: "Squat", muscleGroups: [MuscleGroup.Quads] }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const chips = el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]');
		const chestChip = Array.from(chips).find((c) => c.textContent?.trim() === MuscleGroup.Chest)!;
		const bicepsChip = Array.from(chips).find((c) => c.textContent?.trim() === MuscleGroup.Biceps)!;

		chestChip.click();
		fixture.detectChanges();
		bicepsChip.click();
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(2);
		const names = Array.from(rows).map((r) => r.getAttribute("ng-reflect-exercise-name"));
		expect(names).toContain("Développé couché");
		expect(names).toContain("Curl biceps");
	});
});

describe("StatsExerciseListCardComponent — cardio chip", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<StatsExerciseListCardComponent>>;

	function setup(exercises: ExerciseSummary[]) {
		TestBed.configureTestingModule({
			imports: [StatsExerciseListCardComponent, translateModuleConfig],
		});
		setupI18n();
		fixture = TestBed.createComponent(StatsExerciseListCardComponent);
		fixture.componentRef.setInput("exercises", exercises);
		fixture.detectChanges();
	}

	// Test 2 — no cardio chip when no exercises are cardio
	it("ne doit pas afficher le chip cardio quand aucun exercice n'est cardio", () => {
		setup([
			makeExercise({ name: "Développé couché", isCardio: false, muscleGroups: [MuscleGroup.Chest] }),
			makeExercise({ name: "Curl biceps", isCardio: false, muscleGroups: [MuscleGroup.Biceps] }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const chips = Array.from(el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]'));
		const cardioChip = chips.find((c) => c.textContent?.trim() === "Cardio");
		expect(cardioChip).toBeUndefined();
	});

	// Test 3 — cardio chip appears when at least one exercise is cardio
	it("doit afficher le chip cardio quand au moins un exercice est cardio", () => {
		setup([
			makeExercise({ name: "Développé couché", isCardio: false, muscleGroups: [MuscleGroup.Chest] }),
			makeExercise({ name: "Course", isCardio: true, muscleGroups: [] }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const chips = Array.from(el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]'));
		const cardioChip = chips.find((c) => c.textContent?.trim() === "Cardio");
		expect(cardioChip).toBeTruthy();
	});

	// Test 4 — clicking cardio chip filters to show only cardio exercises
	it("doit filtrer pour n'afficher que les exercices cardio quand le chip cardio est sélectionné", () => {
		setup([
			makeExercise({ name: "Développé couché", isCardio: false, muscleGroups: [MuscleGroup.Chest] }),
			makeExercise({ name: "Curl biceps", isCardio: false, muscleGroups: [MuscleGroup.Biceps] }),
			makeExercise({ name: "Course", isCardio: true, muscleGroups: [] }),
			makeExercise({ name: "Vélo", isCardio: true, muscleGroups: [] }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const chips = Array.from(el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]'));
		const cardioChip = chips.find((c) => c.textContent?.trim() === "Cardio")!;
		cardioChip.click();
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(2);
		const names = Array.from(rows).map((r) => r.getAttribute("ng-reflect-exercise-name"));
		expect(names).toContain("Course");
		expect(names).toContain("Vélo");
	});

	// Test 5 — cardio chip + muscle group chip = union filter
	it("doit afficher les exercices cardio ET les exercices du groupe musculaire sélectionné (union)", () => {
		setup([
			makeExercise({ name: "Développé couché", isCardio: false, muscleGroups: [MuscleGroup.Chest] }),
			makeExercise({ name: "Curl biceps", isCardio: false, muscleGroups: [MuscleGroup.Biceps] }),
			makeExercise({ name: "Course", isCardio: true, muscleGroups: [] }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const chips = Array.from(el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]'));
		const cardioChip = chips.find((c) => c.textContent?.trim() === "Cardio")!;
		const chestChip = chips.find((c) => c.textContent?.trim() === MuscleGroup.Chest)!;

		cardioChip.click();
		fixture.detectChanges();
		chestChip.click();
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(2);
		const names = Array.from(rows).map((r) => r.getAttribute("ng-reflect-exercise-name"));
		expect(names).toContain("Course");
		expect(names).toContain("Développé couché");
	});
});

describe("StatsExerciseListCardComponent — merge button visibility", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<StatsExerciseListCardComponent>>;

	function setup(exercises: ExerciseSummary[]) {
		TestBed.configureTestingModule({
			imports: [StatsExerciseListCardComponent, translateModuleConfig],
		});
		setupI18n();
		fixture = TestBed.createComponent(StatsExerciseListCardComponent);
		fixture.componentRef.setInput("exercises", exercises);
		fixture.detectChanges();
	}

	// Test 1 — merge button is hidden when there are 0 exercises
	it("ne doit pas afficher le bouton merge quand il n'y a aucun exercice", () => {
		setup([]);

		const el: HTMLElement = fixture.nativeElement;
		const mergeBtn = el.querySelector('[data-testid="merge-btn"]');
		expect(mergeBtn).toBeNull();
	});

	// Test 2 — merge button is hidden when there is exactly 1 exercise
	it("ne doit pas afficher le bouton merge quand il y a un seul exercice", () => {
		setup([makeExercise({ name: "Développé couché" })]);

		const el: HTMLElement = fixture.nativeElement;
		const mergeBtn = el.querySelector('[data-testid="merge-btn"]');
		expect(mergeBtn).toBeNull();
	});

	// Test 3 — merge button is visible when there are exactly 2 exercises
	it("doit afficher le bouton merge quand il y a exactement 2 exercices", () => {
		setup([makeExercise({ name: "Développé couché" }), makeExercise({ name: "Curl biceps" })]);

		const el: HTMLElement = fixture.nativeElement;
		const mergeBtn = el.querySelector('[data-testid="merge-btn"]');
		expect(mergeBtn).not.toBeNull();
	});

	// Test 4 — merge button is visible when there are 3 or more exercises
	it("doit afficher le bouton merge quand il y a 3 exercices ou plus", () => {
		setup([
			makeExercise({ name: "Développé couché" }),
			makeExercise({ name: "Curl biceps" }),
			makeExercise({ name: "Squat" }),
		]);

		const el: HTMLElement = fixture.nativeElement;
		const mergeBtn = el.querySelector('[data-testid="merge-btn"]');
		expect(mergeBtn).not.toBeNull();
	});
});
