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
		showMore: "Show more",
		showLess: "Show less",
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

function makeExercises(count: number): ExerciseSummary[] {
	return Array.from({ length: count }, (_, i) => makeExercise({ name: `Exercise ${i + 1}` }));
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

describe("StatsExerciseListCardComponent — search bar visibility and filtering", () => {
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

	// Test 1 — search bar is absent when exercises count <= 20
	it("ne doit pas afficher la barre de recherche quand il y a 20 exercices ou moins", () => {
		setup(makeExercises(20));

		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector('[data-testid="exercise-search-input"]');
		expect(searchBar).toBeNull();
	});

	// Test 2 — search bar appears when exercises count > 20
	it("doit afficher la barre de recherche quand il y a plus de 20 exercices", () => {
		setup(makeExercises(21));

		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector('[data-testid="exercise-search-input"]');
		expect(searchBar).not.toBeNull();
	});

	// Test 3 — typing in the search bar filters exercises by name
	it("doit filtrer les exercices par nom quand on tape dans la barre de recherche", () => {
		const exercises = [
			...makeExercises(20),
			makeExercise({ name: "Développé couché" }),
			makeExercise({ name: "Curl biceps" }),
		];
		setup(exercises);

		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;

		searchBar.value = "Développé";
		searchBar.dispatchEvent(new Event("input"));
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(1);
		expect(rows[0].getAttribute("ng-reflect-exercise-name")).toBe("Développé couché");
	});

	// Test 4 — search is case-insensitive
	it("doit filtrer les exercices sans tenir compte de la casse", () => {
		const exercises = [
			...makeExercises(20),
			makeExercise({ name: "Développé couché" }),
			makeExercise({ name: "Curl biceps" }),
		];
		setup(exercises);

		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;

		searchBar.value = "développé";
		searchBar.dispatchEvent(new Event("input"));
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(1);
		expect(rows[0].getAttribute("ng-reflect-exercise-name")).toBe("Développé couché");
	});

	// Test 5 — search query and tag filter combine with AND logic
	it("doit combiner le filtre par nom et le filtre par tag (intersection)", () => {
		const exercises = [
			...makeExercises(18),
			makeExercise({ name: "Développé couché", muscleGroups: [MuscleGroup.Chest] }),
			makeExercise({ name: "Développé militaire", muscleGroups: [MuscleGroup.Shoulders] }),
			makeExercise({ name: "Curl biceps", muscleGroups: [MuscleGroup.Biceps] }),
			makeExercise({ name: "Curl marteau", muscleGroups: [MuscleGroup.Biceps] }),
		];
		setup(exercises);

		const el: HTMLElement = fixture.nativeElement;

		// Select Biceps tag
		const chips = el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]');
		const bicepsChip = Array.from(chips).find((c) => c.textContent?.trim() === MuscleGroup.Biceps)!;
		bicepsChip.click();
		fixture.detectChanges();

		// Type "curl" in the search bar
		const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;
		searchBar.value = "curl";
		searchBar.dispatchEvent(new Event("input"));
		fixture.detectChanges();

		// Only exercises matching BOTH "curl" in name AND Biceps tag should show
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(2);
		const names = Array.from(rows).map((r) => r.getAttribute("ng-reflect-exercise-name"));
		expect(names).toContain("Curl biceps");
		expect(names).toContain("Curl marteau");
	});
});

describe("StatsExerciseListCardComponent — recherche multi-mots (OR)", () => {
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

	it("doit retourner les exercices contenant au moins un des tokens de la query (logique OR)", () => {
		const exercises = [
			...makeExercises(21),
			makeExercise({ name: "Tractions" }),
			makeExercise({ name: "DC sur le banc" }),
			makeExercise({ name: "Squat" }),
		];
		setup(exercises);

		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;

		searchBar.value = "trac banc";
		searchBar.dispatchEvent(new Event("input"));
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		const names = Array.from(rows).map((r) => r.getAttribute("ng-reflect-exercise-name"));
		expect(names).toContain("Tractions");
		expect(names).toContain("DC sur le banc");
		expect(names).not.toContain("Squat");
	});

	it("doit trouver un exercice dont le nom utilise un espace quand la query utilise un tiret comme séparateur", () => {
		const exercises = [
			...makeExercises(21),
			makeExercise({ name: "Bent over row" }),
			makeExercise({ name: "Squat" }),
		];
		setup(exercises);

		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;

		searchBar.value = "bent-over";
		searchBar.dispatchEvent(new Event("input"));
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		const names = Array.from(rows).map((r) => r.getAttribute("ng-reflect-exercise-name"));
		expect(names).toContain("Bent over row");
		expect(names).not.toContain("Squat");
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

describe("StatsExerciseListCardComponent - liste tronquee et bouton afficher plus", () => {
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

	// T1
	it("8 exercices sans filtre : affiche 8 lignes et aucun bouton toggle", () => {
		setup(makeExercises(8));
		const el: HTMLElement = fixture.nativeElement;
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(8);
		expect(el.querySelector('[data-testid="show-more-toggle"]')).toBeNull();
	});

	// T2
	it("15 exercices avec un tag actif : toutes les lignes correspondantes, aucun toggle", () => {
		const exercises = Array.from({ length: 15 }, (_, i) =>
			makeExercise({ name: `Exercise ${i + 1}`, muscleGroups: [MuscleGroup.Chest] })
		);
		setup(exercises);
		const el: HTMLElement = fixture.nativeElement;
		const chips = el.querySelectorAll<HTMLElement>('[data-testid="tag-filter-chip"]');
		const chestChip = Array.from(chips).find((c) => c.textContent?.trim() === MuscleGroup.Chest)!;
		chestChip.click();
		fixture.detectChanges();
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(15);
		expect(el.querySelector('[data-testid="show-more-toggle"]')).toBeNull();
	});

	// T3
	it("15 exercices en mode fusion : 15 lignes de fusion, aucun toggle", () => {
		setup(makeExercises(15));
		const el: HTMLElement = fixture.nativeElement;
		const mergeBtn = el.querySelector<HTMLElement>('[data-testid="merge-btn"]')!;
		mergeBtn.click();
		fixture.detectChanges();
		const checkboxes = el.querySelectorAll('[data-testid="exercise-merge-checkbox"]');
		expect(checkboxes.length).toBe(15);
		expect(el.querySelector('[data-testid="show-more-toggle"]')).toBeNull();
	});

	// T4
	it("recherche active avec 7 correspondances : 7 lignes, aucun toggle", () => {
		const exercises = [
			...Array.from({ length: 14 }, (_, i) => makeExercise({ name: `Exercise ${i + 1}` })),
			...Array.from({ length: 7 }, (_, i) => makeExercise({ name: `Curl ${i + 1}` })),
		];
		setup(exercises);
		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;
		searchBar.value = "Curl";
		searchBar.dispatchEvent(new Event("input"));
		fixture.detectChanges();
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(7);
		expect(el.querySelector('[data-testid="show-more-toggle"]')).toBeNull();
	});

	// T5
	it("recherche active avec 15 correspondances : 15 lignes, aucun toggle (depasse le seuil)", () => {
		const exercises = [
			...Array.from({ length: 6 }, (_, i) => makeExercise({ name: `Exercise ${i + 1}` })),
			...Array.from({ length: 15 }, (_, i) => makeExercise({ name: `Curl ${i + 1}` })),
		];
		setup(exercises);
		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;
		searchBar.value = "Curl";
		searchBar.dispatchEvent(new Event("input"));
		fixture.detectChanges();
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(15);
		expect(el.querySelector('[data-testid="show-more-toggle"]')).toBeNull();
	});

	// T6
	it("15 exercices sans filtre replie : 10 lignes et bouton Voir plus", () => {
		setup(makeExercises(15));
		const el: HTMLElement = fixture.nativeElement;
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(10);
		expect(el.querySelector('[data-testid="show-more-toggle"]')).not.toBeNull();
	});

	// T7
	it("clic sur Voir plus : 15 lignes et label Voir moins", () => {
		setup(makeExercises(15));
		const el: HTMLElement = fixture.nativeElement;
		const toggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
		toggle.click();
		fixture.detectChanges();
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(15);
		const updatedToggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
		expect(updatedToggle.textContent?.trim()).toContain("Show less");
	});

	// T8
	it("clic sur Voir moins : retour a 10 lignes et label Voir plus", () => {
		setup(makeExercises(15));
		const el: HTMLElement = fixture.nativeElement;
		let toggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
		toggle.click();
		fixture.detectChanges();
		toggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
		toggle.click();
		fixture.detectChanges();
		const rows = el.querySelectorAll("app-exercise-summary-row");
		expect(rows.length).toBe(10);
		const updatedToggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
		expect(updatedToggle.textContent?.trim()).toContain("Show more");
	});

	// T9
	it("le tableau exercises en entree nest jamais mute : longueur identique avant et apres le toggle", () => {
		const exercises = makeExercises(15);
		const originalLength = exercises.length;
		setup(exercises);
		const el: HTMLElement = fixture.nativeElement;
		let toggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
		toggle.click();
		fixture.detectChanges();
		toggle = el.querySelector<HTMLElement>('[data-testid="show-more-toggle"]')!;
		toggle.click();
		fixture.detectChanges();
		expect(exercises.length).toBe(originalLength);
	});
});

describe("StatsExerciseListCardComponent — tri par pertinence (score tokens)", () => {
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

	it("doit afficher en premier l'exercice qui correspond au plus grand nombre de tokens de la query", () => {
		const exercises = [
			...makeExercises(21),
			makeExercise({ name: "Tractions larges" }),                     // score 1: contient "trac"
			makeExercise({ name: "Tractions prise large barre" }),           // score 2: contient "trac" et "barre"
		];
		setup(exercises);

		const el: HTMLElement = fixture.nativeElement;
		const searchBar = el.querySelector<HTMLInputElement>('[data-testid="exercise-search-input"]')!;
		searchBar.value = "trac barre";
		searchBar.dispatchEvent(new Event("input"));
		fixture.detectChanges();

		const rows = el.querySelectorAll("app-exercise-summary-row");
		const names = Array.from(rows).map((r) => r.getAttribute("ng-reflect-exercise-name"));
		expect(names[0]).toBe("Tractions prise large barre");
		expect(names[1]).toBe("Tractions larges");
	});
});
