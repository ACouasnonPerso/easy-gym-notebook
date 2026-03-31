import { TestBed, ComponentFixture } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { ImportConfirmModalComponent } from "./import-confirm-modal.component";

function setup(
	sessionCount: number,
	exerciseCount: number
): {
	fixture: ComponentFixture<ImportConfirmModalComponent>;
	component: ImportConfirmModalComponent;
} {
	TestBed.configureTestingModule({
		imports: [ImportConfirmModalComponent, TranslateModule.forRoot()],
	});

	const fixture = TestBed.createComponent(ImportConfirmModalComponent);
	fixture.componentRef.setInput("sessionCount", sessionCount);
	fixture.componentRef.setInput("exerciseCount", exerciseCount);
	fixture.detectChanges();

	return { fixture, component: fixture.componentInstance };
}

describe("ImportConfirmModalComponent", () => {
	describe("count display", () => {
		it("should display the session and exercise counts passed as inputs", () => {
			const { fixture } = setup(3, 12);
			const el: HTMLElement = fixture.nativeElement;

			expect(el.textContent).toContain("3");
			expect(el.textContent).toContain("12");
		});

		it("should display zero counts when both inputs are 0", () => {
			const { fixture } = setup(0, 0);
			const el: HTMLElement = fixture.nativeElement;

			expect(el.textContent).toContain("0");
		});
	});

	describe("outputs", () => {
		it("should emit confirmed output when the confirm button is clicked", () => {
			const { fixture, component } = setup(2, 5);
			const el: HTMLElement = fixture.nativeElement;

			const confirmed = jasmine.createSpy("confirmed");
			component.confirmed.subscribe(confirmed);

			const confirmBtn = el.querySelector<HTMLButtonElement>('[data-testid="confirm-btn"]');
			expect(confirmBtn).toBeTruthy();
			confirmBtn!.click();

			expect(confirmed).toHaveBeenCalledTimes(1);
		});

		it("should emit cancelled output when the cancel button is clicked", () => {
			const { fixture, component } = setup(2, 5);
			const el: HTMLElement = fixture.nativeElement;

			const cancelled = jasmine.createSpy("cancelled");
			component.cancelled.subscribe(cancelled);

			const cancelBtn = el.querySelector<HTMLButtonElement>('[data-testid="cancel-btn"]');
			expect(cancelBtn).toBeTruthy();
			cancelBtn!.click();

			expect(cancelled).toHaveBeenCalledTimes(1);
		});
	});
});
