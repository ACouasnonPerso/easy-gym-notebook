import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DeleteAllModalComponent } from "./delete-all-modal.component";
import { TranslateService, TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { of } from "rxjs";

class FakeLoader implements TranslateLoader {
	getTranslation(_lang: string) {
		return of({
			deleteAllData: {
				title: "Delete all data",
				body: "This action cannot be undone.",
				inputLabel: "Type «Supprimer» to confirm",
				inputPlaceholder: "Supprimer",
				confirmWord: "Supprimer",
			},
			common: {
				cancel: "Cancel",
				delete: "Delete",
			},
		});
	}
}

describe("DeleteAllModalComponent", () => {
	let component: DeleteAllModalComponent;
	let fixture: ComponentFixture<DeleteAllModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				DeleteAllModalComponent,
				TranslateModule.forRoot({
					loader: { provide: TranslateLoader, useClass: FakeLoader },
				}),
			],
		}).compileComponents();

		const translate = TestBed.inject(TranslateService);
		translate.use("en");

		fixture = TestBed.createComponent(DeleteAllModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	function getInput(): HTMLInputElement {
		return fixture.nativeElement.querySelector("[data-testid='confirm-input']");
	}

	function getConfirmBtn(): HTMLButtonElement {
		return fixture.nativeElement.querySelector("[data-testid='confirm-btn']");
	}

	function getCancelBtn(): HTMLButtonElement {
		return fixture.nativeElement.querySelector("[data-testid='cancel-btn']");
	}

	function getBackdrop(): HTMLElement {
		return fixture.nativeElement.querySelector("[data-testid='backdrop']");
	}

	function typeValue(value: string): void {
		const input = getInput();
		input.value = value;
		input.dispatchEvent(new Event("input"));
		fixture.detectChanges();
	}

	describe("Confirm button disabled state", () => {
		it("should be disabled when input is empty", () => {
			expect(getConfirmBtn().disabled).toBe(true);
		});

		it("should be disabled when typed value does not match confirmWord", () => {
			typeValue("wrong");
			expect(getConfirmBtn().disabled).toBe(true);
		});

		it("should be disabled when typed value is partially correct", () => {
			typeValue("Supprime");
			expect(getConfirmBtn().disabled).toBe(true);
		});
	});

	describe("Confirm button enabled state", () => {
		it("should be enabled when typed value matches exactly", () => {
			typeValue("Supprimer");
			expect(getConfirmBtn().disabled).toBe(false);
		});

		it("should be enabled with leading/trailing spaces", () => {
			typeValue("  Supprimer  ");
			expect(getConfirmBtn().disabled).toBe(false);
		});

		it("should be enabled with different case", () => {
			typeValue("supprimer");
			expect(getConfirmBtn().disabled).toBe(false);
		});

		it("should be enabled with mixed case", () => {
			typeValue("SUPPRIMER");
			expect(getConfirmBtn().disabled).toBe(false);
		});
	});

	describe("Events", () => {
		it("should emit confirmed when confirm button is clicked with matching value", () => {
			let confirmedEmitted = false;
			component.confirmed.subscribe(() => (confirmedEmitted = true));

			typeValue("Supprimer");
			getConfirmBtn().click();

			expect(confirmedEmitted).toBe(true);
		});

		it("should not emit confirmed when confirm button is clicked with non-matching value", () => {
			let confirmedEmitted = false;
			component.confirmed.subscribe(() => (confirmedEmitted = true));

			typeValue("wrong");
			// Button should be disabled, but test the logic guard too
			component.onConfirm();

			expect(confirmedEmitted).toBe(false);
		});

		it("should emit cancelled when cancel button is clicked", () => {
			let cancelledEmitted = false;
			component.cancelled.subscribe(() => (cancelledEmitted = true));

			getCancelBtn().click();

			expect(cancelledEmitted).toBe(true);
		});

		it("should emit cancelled when backdrop is clicked", () => {
			let cancelledEmitted = false;
			component.cancelled.subscribe(() => (cancelledEmitted = true));

			getBackdrop().click();

			expect(cancelledEmitted).toBe(true);
		});
	});
});
