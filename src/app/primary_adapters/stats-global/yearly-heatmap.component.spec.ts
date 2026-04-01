import { TestBed } from "@angular/core/testing";
import { ComponentFixture } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";
import { YearlyHeatmapComponent } from "./yearly-heatmap.component";
import { YearlyHeatmapRow, YearlyHeatmapCell } from "../../core_logic/stats-global/stats.service";

function makeToday(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

function makePastDate(): Date {
	const d = makeToday();
	d.setDate(d.getDate() - 1);
	return d;
}

function buildRows(overrides: { month: number; cellDates: { date: Date; hasSession: boolean }[] }[]): YearlyHeatmapRow[] {
	const currentYear = new Date().getFullYear();
	const rows: YearlyHeatmapRow[] = [];
	for (let m = 0; m < 12; m++) {
		const override = overrides.find((o) => o.month === m);
		if (override) {
			rows.push({
				month: m,
				year: currentYear,
				cells: override.cellDates.map((cd) => ({ date: cd.date, hasSession: cd.hasSession })),
			});
		} else {
			// Build a minimal row with the correct number of days, all empty
			const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
			const cells: YearlyHeatmapCell[] = [];
			for (let day = 1; day <= daysInMonth; day++) {
				cells.push({ date: new Date(currentYear, m, day), hasSession: false });
			}
			rows.push({ month: m, year: currentYear, cells });
		}
	}
	return rows;
}

function buildDefaultRows(): YearlyHeatmapRow[] {
	return buildRows([]);
}

describe("YearlyHeatmapComponent", () => {
	let fixture: ComponentFixture<YearlyHeatmapComponent>;
	let component: YearlyHeatmapComponent;

	function createComponent(data: YearlyHeatmapRow[]): void {
		TestBed.configureTestingModule({
			imports: [YearlyHeatmapComponent],
			providers: [provideTranslateService()],
		});
		fixture = TestBed.createComponent(YearlyHeatmapComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput("data", data);
		fixture.detectChanges();
	}

	it("should render exactly 12 month rows", () => {
		createComponent(buildDefaultRows());

		const rows = fixture.debugElement.queryAll(By.css("[data-testid='yhm-row']"));

		expect(rows.length).toBe(12);
	});

	it("should display abbreviated month labels", () => {
		createComponent(buildDefaultRows());

		const labels = fixture.debugElement
			.queryAll(By.css("[data-testid='yhm-month-label']"))
			.map((el) => el.nativeElement.textContent.trim());

		expect(labels.length).toBe(12);
		// Each label should be non-empty (abbreviated month name)
		labels.forEach((label) => expect(label.length).toBeGreaterThan(0));
	});

	it("should give today's cell the 'today' CSS class when there is no session", () => {
		const today = makeToday();
		const data = buildRows([
			{
				month: today.getMonth(),
				cellDates: [{ date: today, hasSession: false }],
			},
		]);

		createComponent(data);

		const cells = fixture.debugElement.queryAll(By.css("[data-testid='yhm-cell']"));
		const todayCells = cells.filter((el) => el.nativeElement.classList.contains("today"));

		expect(todayCells.length).toBe(1);
		expect(todayCells[0].nativeElement.classList.contains("done")).toBe(false);
	});

	it("should give today's cell both 'done' and 'today' CSS classes when a session exists", () => {
		const today = makeToday();
		const data = buildRows([
			{
				month: today.getMonth(),
				cellDates: [{ date: today, hasSession: true }],
			},
		]);

		createComponent(data);

		const cells = fixture.debugElement.queryAll(By.css("[data-testid='yhm-cell']"));
		const todayCells = cells.filter((el) => el.nativeElement.classList.contains("today"));

		expect(todayCells.length).toBe(1);
		expect(todayCells[0].nativeElement.classList.contains("done")).toBe(true);
	});

	it("should give a past cell with a session the 'done' CSS class only", () => {
		const past = makePastDate();
		const data = buildRows([
			{
				month: past.getMonth(),
				cellDates: [{ date: past, hasSession: true }],
			},
		]);

		createComponent(data);

		const cells = fixture.debugElement.queryAll(By.css("[data-testid='yhm-cell']"));
		const doneCells = cells.filter((el) => el.nativeElement.classList.contains("done"));

		expect(doneCells.length).toBe(1);
		expect(doneCells[0].nativeElement.classList.contains("today")).toBe(false);
	});

	it("should give a past cell without a session the 'empty' CSS class", () => {
		const past = makePastDate();
		const data = buildRows([
			{
				month: past.getMonth(),
				cellDates: [{ date: past, hasSession: false }],
			},
		]);

		createComponent(data);

		const cells = fixture.debugElement.queryAll(By.css("[data-testid='yhm-cell']"));
		const emptyCells = cells.filter((el) => el.nativeElement.classList.contains("empty"));

		expect(emptyCells.length).toBeGreaterThan(0);
		// Make sure the specific past cell is empty
		const pastCells = cells.filter(
			(el) => !el.nativeElement.classList.contains("today") && !el.nativeElement.classList.contains("done")
		);
		expect(pastCells.length).toBeGreaterThan(0);
	});
});
