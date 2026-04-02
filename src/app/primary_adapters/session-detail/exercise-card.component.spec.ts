import { TestBed } from "@angular/core/testing";
import { Component, input, output } from "@angular/core";
import { NgStyle } from "@angular/common";
import { provideTranslateService, TranslateModule, TranslateService } from "@ngx-translate/core";
import { ExerciseCardComponent } from "./exercise-card.component";
import { MuscleGroup, Exercise } from "../../core_logic/shared/models";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";
import { DistanceDisplayPipe } from "../../core_logic/mass-unit/distance-display.pipe";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";
import { signal } from "@angular/core";

@Component({ selector: "app-exercise-expanded", standalone: true, template: "" })
class FakeExerciseExpandedComponent {
	readonly exercise = input.required<Exercise>();
	readonly update = output<Partial<Exercise>>();
	readonly validate = output<void>();
	readonly cancel = output<void>();
	readonly delete = output<void>();
	readonly openChrono = output<void>();
	readonly openStats = output<void>();
	readonly openRating = output<void>();
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Bench Press",
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 60,
		sets: 3,
		reps: 10,
		breakDurationSeconds: 90,
		status: "pending",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		...overrides,
	} as Exercise;
}

async function setup(exercise: Exercise) {
	await TestBed.configureTestingModule({
		imports: [ExerciseCardComponent],
		providers: [
			provideTranslateService({ defaultLanguage: "fr" }),
			{ provide: MassUnitService, useValue: { activeMassUnit: signal<"metric" | "imperial" | "us">("metric") } },
		],
	})
		.overrideComponent(ExerciseCardComponent, {
			set: {
				imports: [FakeExerciseExpandedComponent, NgStyle, TranslateModule, WeightDisplayPipe, DistanceDisplayPipe],
			},
		})
		.compileComponents();

	const translate = TestBed.inject(TranslateService);
	translate.setTranslation("fr", {
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
	});
	translate.use("fr");

	const fixture = TestBed.createComponent(ExerciseCardComponent);
	fixture.componentRef.setInput("exercise", exercise);
	fixture.detectChanges();

	return { fixture, component: fixture.componentInstance };
}

describe("ExerciseCardComponent — pyramid compact display", () => {
	it("should display the individual weight and reps values without a mean symbol when the exercise uses standard mode", async () => {
		const { fixture } = await setup(makeExercise({ isPyramid: false, weightKg: 80, sets: 4, reps: 8 }));

		const el: HTMLElement = fixture.nativeElement;
		expect(el.textContent).toContain("80");
		expect(el.textContent).toContain("8");
		expect(el.textContent).not.toContain("≈");
	});

	it("should display the averaged weight and averaged reps with a mean symbol when the exercise uses pyramid mode", async () => {
		const { fixture } = await setup(
			makeExercise({
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 60, reps: 12 },
					{ weightKg: 80, reps: 8 },
					{ weightKg: 100, reps: 4 },
				],
			})
		);

		const el: HTMLElement = fixture.nativeElement;
		expect(el.textContent).toContain("≈");
		// avg weight = (60+80+100)/3 = 80
		expect(el.textContent).toContain("80");
		// avg reps = (12+8+4)/3 = 8
		expect(el.textContent).toContain("8");
	});

	it("should display a dash instead of averaged values when the exercise uses pyramid mode but the set list is unexpectedly empty", async () => {
		const { fixture } = await setup(makeExercise({ isPyramid: true, pyramidSets: [] }));

		const el: HTMLElement = fixture.nativeElement;
		const statsEl = el.querySelector(".exercise-stats") as HTMLElement;
		expect(statsEl.textContent).toContain("—");
	});
});

describe("ExerciseCardComponent", () => {
	describe("affichage des stats selon le type exercice", () => {
		it("should render weight, sets and reps for a strength exercise", async () => {
			const { fixture } = await setup(
				makeExercise({
					isCardio: false,
					weightKg: 60,
					sets: 3,
					reps: 10,
					durationSeconds: 0,
					distanceKm: null,
				})
			);

			const el: HTMLElement = fixture.nativeElement;
			expect(el.textContent).toContain("60");
			expect(el.textContent).toContain("3");
			expect(el.textContent).toContain("10");
		});

		it("should render duration and distance for a cardio exercise, not weight/sets/reps", async () => {
			const { fixture } = await setup(
				makeExercise({
					isCardio: true,
					durationSeconds: 3600,
					distanceKm: 10,
					weightKg: 0,
					sets: 0,
					reps: 0,
				})
			);

			const el: HTMLElement = fixture.nativeElement;
			const statsEl = el.querySelector(".exercise-stats") as HTMLElement;
			expect(statsEl.textContent).toContain("60");
			expect(statsEl.textContent).toContain("10");
			expect(statsEl.querySelector(".ex-stat-value.orange")?.textContent?.trim()).not.toContain("0 kg");
		});
	});

	describe("affichage des tags muscleGroups", () => {
		it("naffiche aucun tag quand muscleGroups est vide", async () => {
			const { fixture } = await setup(makeExercise({ muscleGroup: null, muscleGroups: [] }));

			const tags = fixture.nativeElement.querySelectorAll(".tag");

			expect(tags.length).toBe(0);
		});

		it("affiche un tag quand muscleGroups contient un seul groupe", async () => {
			const { fixture } = await setup(makeExercise({ muscleGroup: null, muscleGroups: [MuscleGroup.Back] }));

			const tags = fixture.nativeElement.querySelectorAll(".tag");

			expect(tags.length).toBe(1);
			expect(tags[0].textContent.trim()).toBe(MuscleGroup.Back);
		});

		it("affiche deux tags quand muscleGroups contient deux groupes", async () => {
			const { fixture } = await setup(
				makeExercise({ muscleGroup: null, muscleGroups: [MuscleGroup.Chest, MuscleGroup.Triceps] })
			);

			const tags = fixture.nativeElement.querySelectorAll(".tag");

			expect(tags.length).toBe(2);
			expect(tags[0].textContent.trim()).toBe(MuscleGroup.Chest);
			expect(tags[1].textContent.trim()).toBe(MuscleGroup.Triceps);
		});

		it("applique le bon style de couleur à chaque tag selon son groupe musculaire", async () => {
			const { fixture } = await setup(
				makeExercise({ muscleGroup: null, muscleGroups: [MuscleGroup.Back, MuscleGroup.Biceps] })
			);

			const tags = fixture.nativeElement.querySelectorAll(".tag");

			expect(tags[0].style.color).toBe("rgb(52, 152, 219)");
			expect(tags[1].style.color).toBe("rgb(46, 204, 113)");
		});
	});

	describe("tagStyle", () => {
		it("retourne un objet vide quand le muscleGroup est null", async () => {
			const { component } = await setup(makeExercise({ muscleGroup: null }));

			const style = component.tagStyle(null);

			expect(style).toEqual({});
		});

		it("retourne la bonne couleur pour le groupe musculaire Back", async () => {
			const { component } = await setup(makeExercise({ muscleGroup: MuscleGroup.Back }));

			const style = component.tagStyle(MuscleGroup.Back);

			expect(style["color"]).toBe("#3498db");
			expect(style["background"]).toBe("rgba(52,152,219,0.15)");
			expect(style["border"]).toBe("1px solid rgba(52,152,219,0.3)");
		});

		it("retourne la bonne couleur pour le groupe musculaire Chest", async () => {
			const { component } = await setup(makeExercise({ muscleGroup: MuscleGroup.Chest }));

			const style = component.tagStyle(MuscleGroup.Chest);

			expect(style["color"]).toBe("#e74c3c");
			expect(style["background"]).toBe("rgba(231,76,60,0.15)");
			expect(style["border"]).toBe("1px solid rgba(231,76,60,0.3)");
		});

		it("retourne un objet vide pour un muscleGroup inconnu", async () => {
			const { component } = await setup(makeExercise({ muscleGroup: null }));

			const style = component.tagStyle("UnknownGroup" as MuscleGroup);

			expect(style).toEqual({});
		});
	});
});
