import { getXAxisLabel } from './x-axis-label';

describe('getXAxisLabel', () => {
	describe("granularité 'session' → format DD/MM", () => {
		it('devrait retourner 16/03 pour le 16 mars 2026', () => {
			expect(getXAxisLabel(new Date(2026, 2, 16), 'session')).toBe('16/03');
		});

		it('devrait ajouter des zéros (01/01 pour le 1er janvier)', () => {
			expect(getXAxisLabel(new Date(2026, 0, 1), 'session')).toBe('01/01');
		});
	});

	describe("granularité 'week' → S{isoWeek}", () => {
		it('devrait retourner S12 pour le 16 mars 2026 (lundi de la semaine 12)', () => {
			expect(getXAxisLabel(new Date(2026, 2, 16), 'week')).toBe('S12');
		});

		it('devrait retourner S1 pour le 4 janvier 2026 (dimanche en semaine ISO 1)', () => {
			expect(getXAxisLabel(new Date(2026, 0, 4), 'week')).toBe('S1');
		});

		it('devrait retourner S2 pour le 5 janvier 2026 (lundi de la semaine ISO 2)', () => {
			expect(getXAxisLabel(new Date(2026, 0, 5), 'week')).toBe('S2');
		});
	});

	describe("granularité 'month' → nom de mois abrégé (3 lettres anglaises)", () => {
		it("devrait retourner 'Mar' pour mars", () => {
			expect(getXAxisLabel(new Date(2026, 2, 1), 'month')).toBe('Mar');
		});

		it("devrait retourner 'Dec' pour décembre", () => {
			expect(getXAxisLabel(new Date(2026, 11, 15), 'month')).toBe('Dec');
		});
	});

	describe("granularité 'year' → année sur 4 chiffres", () => {
		it("devrait retourner '2026' pour une date en 2026", () => {
			expect(getXAxisLabel(new Date(2026, 5, 1), 'year')).toBe('2026');
		});

		it("devrait retourner '2025' pour une date en 2025", () => {
			expect(getXAxisLabel(new Date(2025, 0, 1), 'year')).toBe('2025');
		});
	});
});
