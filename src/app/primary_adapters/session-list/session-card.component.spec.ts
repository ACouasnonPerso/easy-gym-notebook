import { TestBed, ComponentFixture } from "@angular/core/testing";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { SessionCardComponent } from "./session-card.component";
import { Session, Exercise, MuscleGroup } from "../../core_logic/shared/models";
import { LanguageService } from "../../core_logic/language/language.service";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";
import { signal } from "@angular/core";

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of({
			common: {
				weight: "Poids",
				exercises: "Exercices",
				time: "Temps",
				cardio: "Cardio",
				distance: "Distance",
			},
			muscleGroups: {},
		} as unknown as TranslationObject);
	}
}

const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function makeLanguageServiceStub() {
	const lang = signal("en-US");
	return { activeLang: lang };
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex1",
		sessionId: "sess1",
		name: "Test",
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 60,
		sets: 3,
		reps: 10,
		breakDurationSeconds: 60,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		comment: null,
		...overrides,
	};
}

function makeSession(exercises: Exercise[] = []): Session {
	return {
		id: "sess1",
		date: new Date("2026-03-27"),
		status: "completed",
		durationSeconds: 3600,
		muscleGroup: null,
		exercises,
	};
}

function setupFixture(session: Session): ComponentFixture<SessionCardComponent> {
	TestBed.configureTestingModule({
		imports: [SessionCardComponent, translateModuleConfig],
		providers: [
			{ provide: LanguageService, useValue: makeLanguageServiceStub() },
			{ provide: MassUnitService, useValue: { activeMassUnit: signal<"metric" | "imperial" | "us">("metric") } },
		],
	});

	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");

	const fixture = TestBed.createComponent(SessionCardComponent);
	fixture.componentRef.setInput("session", session);
	fixture.detectChanges();
	return fixture;
}

describe("SessionCardComponent", () => {
	describe("isOnlyCardio", () => {
		it("est false quand la séance n'a pas d'exercices", () => {
			const fixture = setupFixture(makeSession([]));
			expect(fixture.componentInstance.isOnlyCardio()).toBe(false);
		});

		it("est true quand tous les exercices sont cardio", () => {
			const exercises = [makeExercise({ id: "ex1", isCardio: true }), makeExercise({ id: "ex2", isCardio: true })];
			const fixture = setupFixture(makeSession(exercises));
			expect(fixture.componentInstance.isOnlyCardio()).toBe(true);
		});

		it("est false quand la séance contient un mix cardio et non-cardio", () => {
			const exercises = [makeExercise({ id: "ex1", isCardio: true }), makeExercise({ id: "ex2", isCardio: false })];
			const fixture = setupFixture(makeSession(exercises));
			expect(fixture.componentInstance.isOnlyCardio()).toBe(false);
		});
	});

	describe("totalDistanceKm", () => {
		it("vaut 0 quand la séance n'a pas d'exercices cardio validés", () => {
			const fixture = setupFixture(makeSession([]));
			expect(fixture.componentInstance.totalDistanceKm()).toBe(0);
		});

		it("additionne les distanceKm des exercices cardio validés", () => {
			const exercises = [
				makeExercise({ id: "ex1", isCardio: true, distanceKm: 5, status: "validated" }),
				makeExercise({ id: "ex2", isCardio: true, distanceKm: 3.5, status: "validated" }),
				makeExercise({ id: "ex3", isCardio: true, distanceKm: 2, status: "cancelled" }),
				makeExercise({ id: "ex4", isCardio: true, distanceKm: null, status: "validated" }),
			];
			const fixture = setupFixture(makeSession(exercises));
			expect(fixture.componentInstance.totalDistanceKm()).toBe(8.5);
		});
	});

	describe("totalDistanceKmFormatted", () => {
		it('retourne "_" quand la distance totale est 0', () => {
			const fixture = setupFixture(makeSession([]));
			expect(fixture.componentInstance.totalDistanceKmFormatted()).toBe("_");
		});

		it("retourne la distance formatée quand la distance est non nulle", () => {
			const exercises = [makeExercise({ id: "ex1", isCardio: true, distanceKm: 5, status: "validated" })];
			const fixture = setupFixture(makeSession(exercises));
			expect(fixture.componentInstance.totalDistanceKmFormatted()).toBe("5 km");
		});
	});

	describe("affichage dans la carte", () => {
		it("affiche les km et le label Distance quand la séance est uniquement cardio", () => {
			const exercises = [makeExercise({ id: "ex1", isCardio: true, distanceKm: 10, status: "validated" })];
			const fixture = setupFixture(makeSession(exercises));
			const el: HTMLElement = fixture.nativeElement;

			const statValue = el.querySelector(".stat-value.orange")?.textContent?.trim();
			const statLabel = el.querySelector(".stat-value.orange + .stat-label")?.textContent?.trim();

			expect(statValue).toContain("10");
			expect(statValue).toContain("km");
			expect(statLabel).toContain("Distance");
		});

		it("affiche le poids et le label Poids quand la séance contient des exercices non-cardio", () => {
			const exercises = [
				makeExercise({ id: "ex1", isCardio: false, weightKg: 20, sets: 3, reps: 5, status: "validated" }),
			];
			const fixture = setupFixture(makeSession(exercises));
			const el: HTMLElement = fixture.nativeElement;

			const statValue = el.querySelector(".stat-value.orange")?.textContent?.trim();
			const statLabel = el.querySelector(".stat-value.orange + .stat-label")?.textContent?.trim();

			expect(statValue).toContain("300");
			expect(statValue).toContain("kg");
			expect(statLabel).toContain("Poids");
		});
	});

	describe("averageRating", () => {
		it("should return null when no exercises have a rating", () => {
			const exercises = [makeExercise({ id: "ex1", rating: null }), makeExercise({ id: "ex2", rating: null })];
			const fixture = setupFixture(makeSession(exercises));
			expect(fixture.componentInstance.averageRating()).toBeNull();
		});

		it("should return the single rating when only one exercise is rated", () => {
			const exercises = [makeExercise({ id: "ex1", rating: 16 }), makeExercise({ id: "ex2", rating: null })];
			const fixture = setupFixture(makeSession(exercises));
			expect(fixture.componentInstance.averageRating()).toBe(16);
		});

		it("should compute the average over only rated exercises", () => {
			const exercises = [
				makeExercise({ id: "ex1", rating: 14 }),
				makeExercise({ id: "ex2", rating: 18 }),
				makeExercise({ id: "ex3", rating: null }),
			];
			const fixture = setupFixture(makeSession(exercises));
			expect(fixture.componentInstance.averageRating()).toBe(16);
		});

		it("should return null when session has no exercises", () => {
			const fixture = setupFixture(makeSession([]));
			expect(fixture.componentInstance.averageRating()).toBeNull();
		});
	});

});
