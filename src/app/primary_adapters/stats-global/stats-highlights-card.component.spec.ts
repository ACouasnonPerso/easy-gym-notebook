import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StatsHighlightsCardComponent, HIGHLIGHTS_PALETTE } from "./stats-highlights-card.component";
import { HighlightViewModel } from "../../core_logic/stats-global/highlight-metric.model";
import { TranslateModule } from "@ngx-translate/core";

function makeViewModel(overrides: Partial<HighlightViewModel> = {}): HighlightViewModel {
	return {
		id: "weight-pr",
		category: "perf",
		labelKey: "statsGlobal.highlights.weightPr",
		value: "100 kg",
		subValue: "+5 kg",
		exerciseName: "Squat",
		icon: "🥳",
		...overrides,
	};
}

describe("StatsHighlightsCardComponent", () => {
	let fixture: ComponentFixture<StatsHighlightsCardComponent>;
	let component: StatsHighlightsCardComponent;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [StatsHighlightsCardComponent, TranslateModule.forRoot()],
		}).compileComponents();

		fixture = TestBed.createComponent(StatsHighlightsCardComponent);
		component = fixture.componentInstance;
	});

	it("should not render any card when highlights input is empty", () => {
		fixture.componentRef.setInput("highlights", []);
		fixture.detectChanges();
		const card = fixture.nativeElement.querySelector(".highlights-card");
		expect(card).toBeNull();
	});

	it("should render the highlights card when highlights are provided", () => {
		fixture.componentRef.setInput("highlights", [makeViewModel()]);
		fixture.detectChanges();
		const card = fixture.nativeElement.querySelector(".highlights-card");
		expect(card).not.toBeNull();
	});

	it("should render one tile per highlight item", () => {
		fixture.componentRef.setInput("highlights", [
			makeViewModel({ id: "weight-pr" }),
			makeViewModel({ id: "consecutive-weeks", category: "regularity" }),
		]);
		fixture.detectChanges();
		const tiles = fixture.nativeElement.querySelectorAll(".highlight-tile");
		expect(tiles.length).toBe(2);
	});

	it("should apply perf accent class to perf highlight tiles", () => {
		fixture.componentRef.setInput("highlights", [makeViewModel({ category: "perf" })]);
		fixture.detectChanges();
		const tile = fixture.nativeElement.querySelector(".highlight-tile--perf");
		expect(tile).not.toBeNull();
	});

	it("should apply regularity accent class to regularity highlight tiles", () => {
		fixture.componentRef.setInput("highlights", [
			makeViewModel({ id: "consecutive-weeks", category: "regularity", exerciseName: undefined }),
		]);
		fixture.detectChanges();
		const tile = fixture.nativeElement.querySelector(".highlight-tile--regularity");
		expect(tile).not.toBeNull();
	});

	it("should display the main value for each tile", () => {
		fixture.componentRef.setInput("highlights", [makeViewModel({ value: "105 kg" })]);
		fixture.detectChanges();
		const valueEl = fixture.nativeElement.querySelector(".tile-value");
		expect(valueEl.textContent).toContain("105 kg");
	});

	it("should display the exercise name when present", () => {
		fixture.componentRef.setInput("highlights", [makeViewModel({ exerciseName: "Squat" })]);
		fixture.detectChanges();
		const exerciseEl = fixture.nativeElement.querySelector(".tile-exercise");
		expect(exerciseEl.textContent).toContain("Squat");
	});

	it("should not render the exercise name element when exerciseName is absent", () => {
		fixture.componentRef.setInput("highlights", [
			makeViewModel({ exerciseName: undefined }),
		]);
		fixture.detectChanges();
		const exerciseEl = fixture.nativeElement.querySelector(".tile-exercise");
		expect(exerciseEl).toBeNull();
	});

	it("should display the sub-value when provided", () => {
		fixture.componentRef.setInput("highlights", [makeViewModel({ subValue: "+5 kg" })]);
		fixture.detectChanges();
		const subEl = fixture.nativeElement.querySelector(".tile-sub-value");
		expect(subEl.textContent).toContain("+5 kg");
	});

	it("should not render the sub-value element when subValue is absent", () => {
		fixture.componentRef.setInput("highlights", [makeViewModel({ subValue: undefined })]);
		fixture.detectChanges();
		const subEl = fixture.nativeElement.querySelector(".tile-sub-value");
		expect(subEl).toBeNull();
	});

	describe("with a small palette injected (3 colors, 4 highlights)", () => {
		let smallFixture: ComponentFixture<StatsHighlightsCardComponent>;
		let smallComponent: StatsHighlightsCardComponent;

		beforeEach(async () => {
			await TestBed.resetTestingModule();
			await TestBed.configureTestingModule({
				imports: [StatsHighlightsCardComponent, TranslateModule.forRoot()],
				providers: [{ provide: HIGHLIGHTS_PALETTE, useValue: ["red", "blue", "green"] }],
			}).compileComponents();

			smallFixture = TestBed.createComponent(StatsHighlightsCardComponent);
			smallComponent = smallFixture.componentInstance;
		});

		it("should return all unique colors even when highlights count exceeds palette size", () => {
			smallFixture.componentRef.setInput("highlights", [
				makeViewModel({ id: "a" }),
				makeViewModel({ id: "b" }),
				makeViewModel({ id: "c" }),
				makeViewModel({ id: "d" }),
			]);
			smallFixture.detectChanges();
			const colors = smallComponent.tileColors();
			const uniqueColors = new Set(colors);
			expect(uniqueColors.size).toBe(colors.length);
		});
	});
});
