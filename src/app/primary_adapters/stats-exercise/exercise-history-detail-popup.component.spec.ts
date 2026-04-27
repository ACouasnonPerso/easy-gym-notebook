import { TestBed } from "@angular/core/testing";
import { provideTranslateService } from "@ngx-translate/core";
import { ExerciseHistoryDetailPopupComponent } from "./exercise-history-detail-popup.component";
import { ExerciseOccurrence } from "../../core_logic/shared/models";

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
	totalReps: 24,
	status: "validated",
	rating: null,
	comment: null,
	setBreakdown: [
		{ weightKg: 60, reps: 10 },
		{ weightKg: 80, reps: 8 },
		{ weightKg: 100, reps: 6 },
	],
};

function createComponent(occurrence = anOccurrence) {
	TestBed.configureTestingModule({
		imports: [ExerciseHistoryDetailPopupComponent],
		providers: [provideTranslateService({ defaultLanguage: "en" })],
	});
	const fixture = TestBed.createComponent(ExerciseHistoryDetailPopupComponent);
	fixture.componentRef.setInput("occurrence", occurrence);
	fixture.detectChanges();
	return { fixture, component: fixture.componentInstance };
}

describe("ExerciseHistoryDetailPopupComponent", () => {
	it("should display one row per set when the occurrence has multiple sets in its breakdown", () => {
		const { fixture } = createComponent();
		const rows = fixture.nativeElement.querySelectorAll(".set-row");
		expect(rows.length).toBe(3);
	});

	it("should display the weight and reps of each set in its row", () => {
		const { fixture } = createComponent();
		const rows = fixture.nativeElement.querySelectorAll(".set-row");
		expect(rows[0].textContent).toContain("60");
		expect(rows[0].textContent).toContain("10");
		expect(rows[1].textContent).toContain("80");
		expect(rows[1].textContent).toContain("8");
	});

	it("should display no set rows when the occurrence has an empty breakdown", () => {
		const { fixture } = createComponent({ ...anOccurrence, setBreakdown: [] });
		const rows = fixture.nativeElement.querySelectorAll(".set-row");
		expect(rows.length).toBe(0);
	});

	it("should not display the comment section when the occurrence has no comment", () => {
		const { fixture } = createComponent({ ...anOccurrence, comment: null });
		const section = fixture.nativeElement.querySelector(".comment-section");
		expect(section).toBeNull();
	});

	it("should display the comment text when the occurrence has a comment", () => {
		const { fixture } = createComponent({ ...anOccurrence, comment: "Great session" });
		const text = fixture.nativeElement.querySelector(".comment-text");
		expect(text).toBeTruthy();
		expect(text.textContent).toContain("Great session");
	});

	it("should display the edit comment button when the occurrence has a comment", () => {
		const { fixture } = createComponent({ ...anOccurrence, comment: "Great session" });
		const btn = fixture.nativeElement.querySelector(".btn-edit");
		expect(btn).toBeTruthy();
	});

	it("should open the edit comment popup when the user clicks the edit button", () => {
		const { fixture } = createComponent({ ...anOccurrence, comment: "Great session" });
		const btn = fixture.nativeElement.querySelector(".btn-edit");
		btn.click();
		fixture.detectChanges();
		const popup = fixture.nativeElement.querySelector("app-exercise-comment-popup");
		expect(popup).toBeTruthy();
	});

	it("should emit the edited comment with the exercise identifier when the user saves via the edit popup", () => {
		const { fixture, component } = createComponent({ ...anOccurrence, comment: "Great session" });
		component.showEditPopup.set(true);
		fixture.detectChanges();

		let emitted: { exerciseId: string; comment: string | null } | undefined;
		component.commentEdited.subscribe((v: { exerciseId: string; comment: string | null }) => (emitted = v));

		component.onCommentSaved("New note");
		fixture.detectChanges();

		expect(emitted).toEqual({ exerciseId: "ex-1", comment: "New note" });
	});

	it("should close the overlay when the user clicks the backdrop outside the modal body", () => {
		const { fixture, component } = createComponent();
		let emitted = false;
		component.close.subscribe(() => (emitted = true));

		const overlay = fixture.nativeElement.querySelector(".overlay");
		overlay.click();
		fixture.detectChanges();

		expect(emitted).toBe(true);
	});

	it("should close the overlay when the user clicks the close button", () => {
		const { fixture, component } = createComponent();
		let emitted = false;
		component.close.subscribe(() => (emitted = true));

		const btn = fixture.nativeElement.querySelector(".btn-close");
		btn.click();
		fixture.detectChanges();

		expect(emitted).toBe(true);
	});

	it("should not close the overlay when the user clicks inside the modal body", () => {
		const { fixture, component } = createComponent();
		let emitCount = 0;
		component.close.subscribe(() => emitCount++);

		const card = fixture.nativeElement.querySelector(".form-card");
		card.click();
		fixture.detectChanges();

		expect(emitCount).toBe(0);
	});
});
