import { TestBed } from "@angular/core/testing";
import { PhotoModalComponent } from "./photo-modal.component";

async function setup(dataUrl: string) {
	await TestBed.configureTestingModule({
		imports: [PhotoModalComponent],
	}).compileComponents();

	const fixture = TestBed.createComponent(PhotoModalComponent);
	fixture.componentRef.setInput("dataUrl", dataUrl);
	fixture.detectChanges();

	return { fixture, component: fixture.componentInstance };
}

describe("PhotoModalComponent", () => {
	it("should display the photo at full size when opened", async () => {
		const { fixture } = await setup("data:image/jpeg;base64,squat");

		const img: HTMLImageElement = fixture.nativeElement.querySelector("img");

		expect(img).toBeTruthy();
		expect(img.src).toContain("data:image/jpeg;base64,squat");
	});

	it("should emit close when the backdrop is clicked", async () => {
		const { fixture, component } = await setup("data:image/jpeg;base64,squat");
		let emitCount = 0;
		component.close.subscribe(() => emitCount++);

		const overlay: HTMLElement = fixture.nativeElement.querySelector(".photo-modal-overlay");
		overlay.click();
		fixture.detectChanges();

		expect(emitCount).toBe(1);
	});

	it("should NOT emit close when the modal content is clicked (only backdrop)", async () => {
		const { fixture, component } = await setup("data:image/jpeg;base64,squat");
		let emitCount = 0;
		component.close.subscribe(() => emitCount++);

		const modalContent: HTMLElement = fixture.nativeElement.querySelector(".photo-modal-content");
		modalContent.click();
		fixture.detectChanges();

		expect(emitCount).toBe(0);
	});

	it("should emit close exactly once when the close button is clicked", async () => {
		const { fixture, component } = await setup("data:image/jpeg;base64,squat");
		let emitCount = 0;
		component.close.subscribe(() => emitCount++);

		const btn: HTMLButtonElement = fixture.nativeElement.querySelector(".photo-modal-close");
		btn.click();
		fixture.detectChanges();

		expect(emitCount).toBe(1);
	});

	it("should emit close when Escape key is pressed", async () => {
		const { fixture, component } = await setup("data:image/jpeg;base64,squat");
		let emitCount = 0;
		component.close.subscribe(() => emitCount++);

		const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
		document.dispatchEvent(event);
		fixture.detectChanges();

		expect(emitCount).toBe(1);
	});

	it("should not emit close more than once for a single Escape press", async () => {
		const { fixture, component } = await setup("data:image/jpeg;base64,squat");
		let emitCount = 0;
		component.close.subscribe(() => emitCount++);

		const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
		document.dispatchEvent(event);
		fixture.detectChanges();

		expect(emitCount).toBe(1);
	});
});
