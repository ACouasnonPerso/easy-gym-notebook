import { TestBed } from "@angular/core/testing";
import { provideTranslateService } from "@ngx-translate/core";
import { HeatmapComponent, HeatmapCell } from "./heatmap.component";

function makeToday(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

function makeCell(date: Date, opts: Partial<HeatmapCell> = {}): HeatmapCell {
	return {
		date,
		hasSession: false,
		isCurrentMonth: true,
		tags: [],
		hasCardio: false,
		...opts,
	};
}

describe("HeatmapComponent — jours futurs du mois courant", () => {
	let component: HeatmapComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HeatmapComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(HeatmapComponent);
		component = fixture.componentInstance;
	});

	it("ne doit PAS retourner 'hm-cell dim' pour un jour futur appartenant au mois courant", () => {
		const tomorrow = makeToday();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const cell = makeCell(tomorrow, { isCurrentMonth: true, hasSession: false });

		const cssClass = component.getCellClass(cell);

		expect(cssClass).not.toBe("hm-cell dim");
	});

	it("doit retourner 'hm-cell empty' pour un jour futur appartenant au mois courant", () => {
		const tomorrow = makeToday();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const cell = makeCell(tomorrow, { isCurrentMonth: true, hasSession: false });

		const cssClass = component.getCellClass(cell);

		expect(cssClass).toBe("hm-cell empty");
	});
});

describe("HeatmapComponent — jour actuel", () => {
	let component: HeatmapComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HeatmapComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(HeatmapComponent);
		component = fixture.componentInstance;
	});

	it("devrait retourner une classe contenant 'today' pour le jour actuel sans séance", () => {
		const cell = makeCell(makeToday(), { hasSession: false });

		const cssClass = component.getCellClass(cell);

		expect(cssClass).toContain("today");
	});

	it("devrait retourner 'hm-cell done today' pour le jour actuel avec une séance", () => {
		const cell = makeCell(makeToday(), { hasSession: true });

		const cssClass = component.getCellClass(cell);

		expect(cssClass).toBe("hm-cell done today");
	});

	it("devrait retourner 'hm-cell empty' pour un jour passé sans séance (pas aujourd'hui)", () => {
		const yesterday = makeToday();
		yesterday.setDate(yesterday.getDate() - 1);
		const cell = makeCell(yesterday, { hasSession: false });

		const cssClass = component.getCellClass(cell);

		expect(cssClass).toBe("hm-cell empty");
	});
});

describe("HeatmapComponent — popover au clic", () => {
	let component: HeatmapComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HeatmapComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(HeatmapComponent);
		component = fixture.componentInstance;
	});

	it("devrait avoir selectedCell à null par défaut", () => {
		expect(component.selectedCell()).toBeNull();
	});

	it("devrait stocker la cellule cliquée dans selectedCell", () => {
		const cell = makeCell(makeToday(), { hasSession: true });

		component.onCellClick(cell);

		expect(component.selectedCell()).toBe(cell);
	});

	it("devrait refermer le popover en cliquant une seconde fois sur la même cellule", () => {
		const cell = makeCell(makeToday(), { hasSession: true });
		component.onCellClick(cell);

		component.onCellClick(cell);

		expect(component.selectedCell()).toBeNull();
	});

	it('devrait formater la date en français abrégé : "Jeu 26 mars"', () => {
		const thursday26March = new Date(2026, 2, 26); // 26 mars 2026, un jeudi
		const cell = makeCell(thursday26March, { hasSession: true, tags: [] });

		const label = component.formatPopoverLabel(cell);

		expect(label).toBe("Jeu 26 mars");
	});

	it("devrait inclure les tags après les deux-points quand la cellule en a", () => {
		const thursday26March = new Date(2026, 2, 26);
		const cell = makeCell(thursday26March, { hasSession: true, tags: ["Chest", "Biceps"] });

		const label = component.formatPopoverLabel(cell);

		expect(label).toBe("Jeu 26 mars : Chest, Biceps");
	});

	it("devrait n'afficher que la date quand la cellule n'a pas de tags", () => {
		const thursday26March = new Date(2026, 2, 26);
		const cell = makeCell(thursday26March, { hasSession: true, tags: [] });

		const label = component.formatPopoverLabel(cell);

		expect(label).toBe("Jeu 26 mars");
	});
});
