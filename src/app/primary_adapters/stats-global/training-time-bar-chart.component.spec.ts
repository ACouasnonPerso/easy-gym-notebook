import { TestBed } from "@angular/core/testing";
import { TrainingTimeBarChartComponent, resolveAutoMode } from "./training-time-bar-chart.component";

function makeEntry(date: Date, durationSeconds: number) {
	return { date, durationSeconds };
}

describe("TrainingTimeBarChartComponent — format de durée", () => {
	let component: TrainingTimeBarChartComponent;

	beforeEach(() => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);
		component = fixture.componentInstance;
	});

	it('devrait afficher "1h30" pour 5400 secondes', () => {
		expect(component.formatDuration(5400)).toBe("1h30");
	});

	it('devrait afficher "45min" pour 2700 secondes', () => {
		expect(component.formatDuration(2700)).toBe("45min");
	});

	it('devrait afficher "1h" pour 3600 secondes', () => {
		expect(component.formatDuration(3600)).toBe("1h");
	});
});

describe("TrainingTimeBarChartComponent — rendu des barres", () => {
	it("devrait ne pas rendre de barre pour les entrées avec durationSeconds === 0", () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 2, 5), 3600),
			makeEntry(new Date(2026, 2, 10), 0),
			makeEntry(new Date(2026, 2, 15), 1800),
		]);
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]');
		expect(bars.length).toBe(2);
	});

	it("devrait calculer la hauteur relative correcte (la barre max atteint 100%)", () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 2, 5), 3600),
			makeEntry(new Date(2026, 2, 10), 1800),
		]);
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
		expect(bars[0].style.height).toBe("100%");
		expect(bars[1].style.height).toBe("50%");
	});

	it("devrait rendre N barres pour N entrées avec durée > 0", () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 2, 5), 3600),
			makeEntry(new Date(2026, 2, 10), 2700),
			makeEntry(new Date(2026, 2, 15), 1800),
		]);
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]');
		expect(bars.length).toBe(3);
	});
});

describe("TrainingTimeBarChartComponent — regroupement par période", () => {
	it('mode "day": deux sessions le même jour sont cumulées en une seule barre', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 2, 10, 9, 0), 1800),
			makeEntry(new Date(2026, 2, 10, 17, 0), 3600),
		]);
		fixture.componentRef.setInput("mode", "day");
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
		expect(bars.length).toBe(1);
		expect(bars[0].style.height).toBe("100%");
	});

	it('mode "day": deux sessions sur des jours différents restent deux barres séparées', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 2, 10), 1800),
			makeEntry(new Date(2026, 2, 11), 3600),
		]);
		fixture.componentRef.setInput("mode", "day");
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
		expect(bars.length).toBe(2);
	});

	it('mode "week": deux sessions la même semaine sont cumulées en une seule barre', () => {
		// lundi 9 mars 2026 et mercredi 11 mars 2026 — même semaine ISO
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 2, 9), 1800), // lundi
			makeEntry(new Date(2026, 2, 11), 3600), // mercredi
		]);
		fixture.componentRef.setInput("mode", "week");
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
		expect(bars.length).toBe(1);
		// durée cumulée = 5400s — barre unique à 100%
		expect(bars[0].style.height).toBe("100%");
	});

	it('mode "week": deux sessions sur des semaines différentes restent deux barres séparées', () => {
		// lundi 9 mars 2026 (sem 11) et lundi 16 mars 2026 (sem 12)
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 2, 9), 1800), // semaine 11
			makeEntry(new Date(2026, 2, 16), 3600), // semaine 12
		]);
		fixture.componentRef.setInput("mode", "week");
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
		expect(bars.length).toBe(2);
	});

	it('mode "month": deux sessions le même mois sont cumulées en une seule barre', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 2, 5), 1800),
			makeEntry(new Date(2026, 2, 20), 3600),
		]);
		fixture.componentRef.setInput("mode", "month");
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
		expect(bars.length).toBe(1);
		expect(bars[0].style.height).toBe("100%");
	});

	it('mode "month": deux sessions sur des mois différents restent deux barres séparées', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		fixture.componentRef.setInput("sessions", [
			makeEntry(new Date(2026, 1, 15), 1800), // février
			makeEntry(new Date(2026, 2, 15), 3600), // mars
		]);
		fixture.componentRef.setInput("mode", "month");
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
		expect(bars.length).toBe(2);
	});
});

describe("resolveAutoMode — sélection automatique du mode de regroupement", () => {
	function makeDaySessions(count: number): { date: Date; durationSeconds: number }[] {
		return Array.from({ length: count }, (_, i) => ({
			date: new Date(2026, 2, i + 1), // 1 mars, 2 mars, …
			durationSeconds: 3600,
		}));
	}

	it('devrait retourner "day" quand le nombre de sessions distinctes est <= 10', () => {
		const sessions = makeDaySessions(10);
		expect(resolveAutoMode(sessions, "day")).toBe("day");
	});

	it('devrait passer en mode "week" quand le nombre de jours distincts dépasse 10', () => {
		// 11 sessions sur 11 jours consécutifs = 11 barres en mode day → bascule sur week
		const sessions = makeDaySessions(11);
		expect(resolveAutoMode(sessions, "day")).toBe("week");
	});

	it("le composant doit auto-regrouper par semaine quand >10 jours distincts, et rendre <= 10 barres dans le DOM", () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		// 11 sessions sur 11 jours différents en mode "day" → devrait basculer sur "week"
		const sessions = Array.from({ length: 11 }, (_, i) => ({
			date: new Date(2026, 2, i + 1),
			durationSeconds: 3600,
		}));
		fixture.componentRef.setInput("sessions", sessions);
		fixture.componentRef.setInput("mode", "day");
		fixture.detectChanges();

		const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
		expect(bars.length).toBeLessThanOrEqual(10);
	});

	it('devrait respecter le mode minimum imposé par le parent : mode "month" avec peu de données reste "month"', () => {
		// Le parent impose 'month' (vue annuelle), même si on n'a que 3 sessions
		// resolveAutoMode ne doit jamais rétrograder vers 'day' ou 'week'
		const sessions = makeDaySessions(3);
		expect(resolveAutoMode(sessions, "month")).toBe("month");
	});

	it('devrait passer en mode "month" quand le nombre de semaines distinctes dépasse aussi 10', () => {
		// 11 sessions réparties sur 11 semaines différentes (une par semaine sur ~3 mois)
		// → day : 11 barres > 10, week : 11 barres > 10, month : 3 barres <= 10
		const sessions = Array.from({ length: 11 }, (_, i) => ({
			date: new Date(2025, 9 + Math.floor(i / 4), 1 + (i % 4) * 7), // ~1 par semaine, 3 mois
			durationSeconds: 3600,
		}));
		// S'assurer qu'on a bien > 10 semaines distinctes
		const weekKeys = new Set(
			sessions.map((s) => {
				const tmp = new Date(s.date);
				tmp.setHours(0, 0, 0, 0);
				const day = tmp.getDay();
				const diff = day === 0 ? -6 : 1 - day;
				tmp.setDate(tmp.getDate() + diff);
				return `${tmp.getFullYear()}-W${tmp.getMonth()}-${tmp.getDate()}`;
			})
		);
		expect(weekKeys.size).toBeGreaterThan(10);
		expect(resolveAutoMode(sessions, "day")).toBe("month");
	});
});

describe("TrainingTimeBarChartComponent — label de date adapté au mode effectif", () => {
	let component: TrainingTimeBarChartComponent;

	beforeEach(() => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);
		component = fixture.componentInstance;
	});

	it('mode "day" : doit retourner la date au format "jj/mm" (ex: "29/03")', () => {
		const date = new Date(2026, 2, 29); // 29 mars 2026
		expect(component.formatDateLabel(date, "day")).toBe("29/03");
	});

	it('mode "week" : doit retourner le numéro de semaine ISO préfixé de "S" (ex: "S13")', () => {
		// 29 mars 2026 est en semaine ISO 13
		const date = new Date(2026, 2, 29);
		expect(component.formatDateLabel(date, "week")).toBe("S13");
	});

	it('mode "month" : doit retourner le mois abrégé en français (ex: "Jan", "Mar")', () => {
		const jan = new Date(2026, 0, 15);
		const mar = new Date(2026, 2, 15);
		expect(component.formatDateLabel(jan, "month")).toBe("Jan");
		expect(component.formatDateLabel(mar, "month")).toBe("Mar");
	});

	it('mode "year" : doit retourner l\'année en 4 chiffres (ex: "2026")', () => {
		const date = new Date(2026, 5, 1);
		expect(component.formatDateLabel(date, "year")).toBe("2026");
	});
});

describe("TrainingTimeBarChartComponent — dateLabel dans le DOM reflète le mode effectif", () => {
	it('mode "week" : le dateLabel affiché doit être un numéro de semaine "Snn"', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		// 11 sessions sur 11 jours consécutifs → resolveAutoMode bascule sur "week"
		const sessions = Array.from({ length: 11 }, (_, i) => ({
			date: new Date(2026, 2, i + 1),
			durationSeconds: 3600,
		}));
		fixture.componentRef.setInput("sessions", sessions);
		fixture.componentRef.setInput("mode", "day");
		fixture.detectChanges();

		const labels = fixture.nativeElement.querySelectorAll(".bar-label-bottom") as NodeListOf<HTMLElement>;
		expect(labels.length).toBeGreaterThan(0);
		Array.from(labels).forEach((label) => {
			expect(label.textContent?.trim()).toMatch(/^S\d+$/);
		});
	});

	it('mode "month" : le dateLabel affiché doit être un mois abrégé', () => {
		const fixture = TestBed.configureTestingModule({
			imports: [TrainingTimeBarChartComponent],
		}).createComponent(TrainingTimeBarChartComponent);

		// 1 session par mois sur 3 mois, mode imposé "month"
		const sessions = [
			{ date: new Date(2026, 0, 15), durationSeconds: 3600 },
			{ date: new Date(2026, 1, 15), durationSeconds: 3600 },
			{ date: new Date(2026, 2, 15), durationSeconds: 3600 },
		];
		fixture.componentRef.setInput("sessions", sessions);
		fixture.componentRef.setInput("mode", "month");
		fixture.detectChanges();

		const labels = fixture.nativeElement.querySelectorAll(".bar-label-bottom") as NodeListOf<HTMLElement>;
		expect(labels.length).toBe(3);
		expect(labels[0].textContent?.trim()).toBe("Jan");
		expect(labels[1].textContent?.trim()).toBe("Fév");
		expect(labels[2].textContent?.trim()).toBe("Mar");
	});
});
