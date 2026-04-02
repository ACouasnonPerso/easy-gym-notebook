import { TestBed } from "@angular/core/testing";
import { provideTranslateService } from "@ngx-translate/core";
import { ExerciseCommentPopupComponent } from "./exercise-comment-popup.component";

function createComponent(currentComment: string | null) {
	TestBed.configureTestingModule({
		imports: [ExerciseCommentPopupComponent],
		providers: [provideTranslateService({ defaultLanguage: "en" })],
	});
	const fixture = TestBed.createComponent(ExerciseCommentPopupComponent);
	fixture.componentRef.setInput("currentComment", currentComment);
	fixture.detectChanges();
	return { fixture, component: fixture.componentInstance };
}

describe("ExerciseCommentPopupComponent", () => {
	it("should display the current comment in the textarea", () => {
		const { fixture } = createComponent("Nice form today");

		const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector("textarea");

		expect(textarea).toBeTruthy();
		expect(textarea.value).toBe("Nice form today");
	});

	it("should update internal text value when user types in the textarea", () => {
		const { fixture, component } = createComponent("old text");

		const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector("textarea");
		textarea.value = "new text";
		textarea.dispatchEvent(new Event("input"));
		fixture.detectChanges();

		expect(component.textValue()).toBe("new text");
	});

	it("should emit commentSaved with the current text when save button is clicked", () => {
		const { fixture, component } = createComponent("initial comment");
		let emitted: string | null | undefined;
		component.commentSaved.subscribe((v: string | null) => (emitted = v));

		const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector("textarea");
		textarea.value = "updated comment";
		textarea.dispatchEvent(new Event("input"));
		fixture.detectChanges();

		const saveBtn = fixture.nativeElement.querySelector(".btn-save");
		saveBtn.click();

		expect(emitted).toBe("updated comment");
	});

	it("should emit cancelled when the overlay background is clicked", () => {
		const { fixture, component } = createComponent(null);
		let cancelCalled = false;
		component.cancelled.subscribe(() => (cancelCalled = true));

		const overlay = fixture.nativeElement.querySelector(".overlay");
		overlay.click();

		expect(cancelCalled).toBeTrue();
	});
});
