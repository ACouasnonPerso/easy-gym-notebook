import { TestBed } from "@angular/core/testing";
import { provideTranslateService } from "@ngx-translate/core";
import { ExerciseRatingPopupComponent } from "./exercise-rating-popup.component";

function createComponent(currentRating: number | null) {
	TestBed.configureTestingModule({
		imports: [ExerciseRatingPopupComponent],
		providers: [provideTranslateService({ defaultLanguage: "en" })],
	});
	const fixture = TestBed.createComponent(ExerciseRatingPopupComponent);
	fixture.componentRef.setInput("currentRating", currentRating);
	fixture.detectChanges();
	return { fixture, component: fixture.componentInstance };
}

describe("ExerciseRatingPopupComponent", () => {
	it("should emit the selected rating value when user taps a rating option", () => {
		const { component } = createComponent(null);
		let emitted: number | null | undefined;
		component.ratingSelected.subscribe((v: number | null) => (emitted = v));

		component.selectRating(16);

		expect(emitted).toBe(16);
	});

	it("should emit null when user taps the already-selected rating to clear it", () => {
		const { component } = createComponent(16);
		let emitted: number | null | undefined;
		component.ratingSelected.subscribe((v: number | null) => (emitted = v));

		component.selectRating(16);

		expect(emitted).toBeNull();
	});

	it("should emit cancelled when the overlay background is clicked", () => {
		const { fixture, component } = createComponent(null);
		let cancelCalled = false;
		component.cancelled.subscribe(() => (cancelCalled = true));

		const overlay = fixture.nativeElement.querySelector(".overlay");
		overlay.click();

		expect(cancelCalled).toBeTrue();
	});

	it("should highlight the currently selected rating option", () => {
		const { fixture } = createComponent(18);

		const activeOption = fixture.nativeElement.querySelector(".rating-option--active");

		expect(activeOption).toBeTruthy();
		expect(activeOption.textContent).toContain("18");
	});

	it("should display all 12 rating options", () => {
		const { fixture } = createComponent(null);

		const options = fixture.nativeElement.querySelectorAll(".rating-option");

		expect(options.length).toBe(12);
	});
});
