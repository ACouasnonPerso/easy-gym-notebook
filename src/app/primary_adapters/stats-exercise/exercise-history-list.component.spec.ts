import { TestBed } from "@angular/core/testing";
import { provideTranslateService } from "@ngx-translate/core";
import { ExerciseHistoryListComponent } from "./exercise-history-list.component";
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
	status: "validated",
	rating: null,
	comment: "Good session today",
};

function createComponent() {
	TestBed.configureTestingModule({
		imports: [ExerciseHistoryListComponent],
		providers: [provideTranslateService({ defaultLanguage: "en" })],
	});
	const fixture = TestBed.createComponent(ExerciseHistoryListComponent);
	fixture.componentRef.setInput("isCardio", false);
	fixture.componentRef.setInput("occurrences", [anOccurrence]);
	fixture.componentRef.setInput("cardioOccurrences", []);
	fixture.detectChanges();
	return { fixture, component: fixture.componentInstance };
}

describe("ExerciseHistoryListComponent — comment modal", () => {
	it("should show the comment modal when openComment is called with an occurrence", () => {
		const { fixture, component } = createComponent();

		component.openComment(anOccurrence, new MouseEvent("click"));
		fixture.detectChanges();

		const modal = fixture.nativeElement.querySelector(".comment-modal");
		expect(modal).toBeTruthy();
	});

	it("should display the occurrence comment text in the modal", () => {
		const { fixture, component } = createComponent();

		component.openComment(anOccurrence, new MouseEvent("click"));
		fixture.detectChanges();

		const text = fixture.nativeElement.querySelector(".comment-text");
		expect(text.textContent).toContain("Good session today");
	});

	it("should show a btn-edit button inside the modal", () => {
		const { fixture, component } = createComponent();

		component.openComment(anOccurrence, new MouseEvent("click"));
		fixture.detectChanges();

		const editBtn = fixture.nativeElement.querySelector(".btn-edit");
		expect(editBtn).toBeTruthy();
	});

	it("should show app-exercise-comment-popup when btn-edit is clicked", () => {
		const { fixture, component } = createComponent();

		component.openComment(anOccurrence, new MouseEvent("click"));
		fixture.detectChanges();

		const editBtn = fixture.nativeElement.querySelector(".btn-edit");
		editBtn.click();
		fixture.detectChanges();

		const popup = fixture.nativeElement.querySelector("app-exercise-comment-popup");
		expect(popup).toBeTruthy();
	});

	it("should emit commentEdited output and close modal when onCommentSaved is called", () => {
		const { fixture, component } = createComponent();
		component.openComment(anOccurrence, new MouseEvent("click"));
		component.openEditPopup();
		fixture.detectChanges();

		let emitted: { exerciseId: string; comment: string | null } | undefined;
		component.commentEdited.subscribe((v: { exerciseId: string; comment: string | null }) => (emitted = v));

		component.onCommentSaved("Updated note");
		fixture.detectChanges();

		expect(emitted).toEqual({ exerciseId: "ex-1", comment: "Updated note" });
		expect(fixture.nativeElement.querySelector(".comment-modal")).toBeNull();
	});
});
