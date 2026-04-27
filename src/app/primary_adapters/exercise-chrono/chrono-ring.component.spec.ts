import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";
import { ChronoRingComponent } from "./chrono-ring.component";

function createComponent(chronoState: string) {
	TestBed.configureTestingModule({
		imports: [ChronoRingComponent],
		providers: [provideTranslateService({ defaultLanguage: "en" })],
	});

	const fixture = TestBed.createComponent(ChronoRingComponent);
	fixture.componentRef.setInput("formattedTime", "00:30");
	fixture.componentRef.setInput("statusLabel", "Training");
	fixture.componentRef.setInput("ringColor", "#4caf50");
	fixture.componentRef.setInput("ringOffset", 0);
	fixture.componentRef.setInput("chronoState", chronoState);
	fixture.detectChanges();
	return fixture;
}

describe("ChronoRingComponent Story 5 - OVER state", () => {
	it("renders OVER label when chronoState is over", () => {
		const fixture = createComponent("over");
		const overLabel = fixture.debugElement.query(By.css("[data-testid='over-label']"));
		expect(overLabel).not.toBeNull();
	});

	it("does not render OVER label when chronoState is training", () => {
		const fixture = createComponent("training");
		const overLabel = fixture.debugElement.query(By.css("[data-testid='over-label']"));
		expect(overLabel).toBeNull();
	});

	it("renders time when state is not over", () => {
		const fixture = createComponent("training");
		const timeEl = fixture.debugElement.query(By.css(".chrono-time"));
		expect(timeEl.nativeElement.textContent).toContain("00:30");
	});
});
