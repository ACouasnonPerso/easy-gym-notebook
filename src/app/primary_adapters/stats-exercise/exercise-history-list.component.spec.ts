import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";
import { ExerciseHistoryListComponent } from "./exercise-history-list.component";
import { ExerciseHistoryDetailPopupComponent } from "./exercise-history-detail-popup.component";
import { ExerciseOccurrence, CardioOccurrence } from "../../core_logic/shared/models";

const anOccurrence: ExerciseOccurrence = {
	exerciseId: "ex-1",
	sessionId: "sess-1",
	date: new Date("2024-01-15"),
	name: "Bench press",
	weightKg: 80,
	sets: 3,
	reps: 8,
	breakDurationSeconds: 90,
	volumeKg: 1920,
	status: "validated",
	rating: null,
	comment: null,
	setBreakdown: [],
};

const aCardioOccurrence: CardioOccurrence = {
	date: new Date("2024-01-16"),
	durationSeconds: 1800,
	distanceKm: 5,
};

function createComponent(isCardio = false) {
	TestBed.configureTestingModule({
		imports: [ExerciseHistoryListComponent],
		providers: [provideTranslateService({ defaultLanguage: "en" })],
	});
	const fixture = TestBed.createComponent(ExerciseHistoryListComponent);
	if (isCardio) {
		fixture.componentRef.setInput("isCardio", true);
		fixture.componentRef.setInput("occurrences", []);
		fixture.componentRef.setInput("cardioOccurrences", [aCardioOccurrence]);
	} else {
		fixture.componentRef.setInput("isCardio", false);
		fixture.componentRef.setInput("occurrences", [anOccurrence]);
		fixture.componentRef.setInput("cardioOccurrences", []);
	}
	fixture.detectChanges();
	return { fixture, component: fixture.componentInstance };
}

describe("ExerciseHistoryListComponent — card click behaviour", () => {
	it("NEW-1: non-cardio card without comment has [class.history-card--clickable]", () => {
		const { fixture } = createComponent();
		const card = fixture.nativeElement.querySelector(".history-card");
		expect(card.classList.contains("history-card--clickable")).toBeTrue();
	});

	it("NEW-2: clicking a non-cardio card opens app-exercise-history-detail-popup", () => {
		const { fixture } = createComponent();
		const card = fixture.nativeElement.querySelector(".history-card");
		card.click();
		fixture.detectChanges();
		const popup = fixture.nativeElement.querySelector("app-exercise-history-detail-popup");
		expect(popup).toBeTruthy();
	});

	it("NEW-3: the popup receives the correct occurrence input", () => {
		const { fixture, component } = createComponent();
		component.openComment(anOccurrence);
		fixture.detectChanges();
		const popupDE = fixture.debugElement.query(By.directive(ExerciseHistoryDetailPopupComponent));
		expect(popupDE).toBeTruthy();
		const popupInstance = popupDE.componentInstance as ExerciseHistoryDetailPopupComponent;
		expect(popupInstance.occurrence()).toEqual(anOccurrence);
	});

	it("NEW-4: cardio cards have no [class.history-card--clickable] and clicking does not open app-exercise-history-detail-popup", () => {
		const { fixture } = createComponent(true);
		const card = fixture.nativeElement.querySelector(".history-card");
		expect(card.classList.contains("history-card--clickable")).toBeFalse();
		card.click();
		fixture.detectChanges();
		const popup = fixture.nativeElement.querySelector("app-exercise-history-detail-popup");
		expect(popup).toBeNull();
	});
});

describe("ExerciseHistoryListComponent — popup lifecycle", () => {
	it("NEW-5: popup close event clears active occurrence (popup removed from DOM)", () => {
		const { fixture, component } = createComponent();
		component.openComment(anOccurrence);
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector("app-exercise-history-detail-popup")).toBeTruthy();

		component.closeComment();
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector("app-exercise-history-detail-popup")).toBeNull();
	});

	it("NEW-6: popup commentEdited output is forwarded by the list's commentEdited output", () => {
		const { fixture, component } = createComponent();
		component.openComment(anOccurrence);
		fixture.detectChanges();

		let emitted: { exerciseId: string; comment: string | null } | undefined;
		component.commentEdited.subscribe((v: { exerciseId: string; comment: string | null }) => (emitted = v));

		component.onDetailCommentEdited({ exerciseId: "ex-1", comment: "New comment" });
		fixture.detectChanges();

		expect(emitted).toEqual({ exerciseId: "ex-1", comment: "New comment" });
		expect(fixture.nativeElement.querySelector("app-exercise-history-detail-popup")).toBeNull();
	});
});
