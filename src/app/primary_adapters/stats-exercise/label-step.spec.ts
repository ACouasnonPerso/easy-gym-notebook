import { getLabelStep } from "./label-step";

describe("getLabelStep — réduction de fréquence des labels", () => {
	it("devrait retourner 1 pour 10 valeurs ou moins", () => {
		expect(getLabelStep(1)).toBe(1);
		expect(getLabelStep(10)).toBe(1);
	});

	it("devrait retourner 2 pour 11 valeurs (> 10)", () => {
		expect(getLabelStep(11)).toBe(2);
		expect(getLabelStep(20)).toBe(2);
	});

	it("devrait retourner 5 pour 21 valeurs (> 20)", () => {
		expect(getLabelStep(21)).toBe(5);
		expect(getLabelStep(30)).toBe(5);
	});

	it("devrait retourner 10 pour 31 valeurs (> 30)", () => {
		expect(getLabelStep(31)).toBe(10);
		expect(getLabelStep(100)).toBe(10);
	});

	it("devrait retourner 20 pour 101 valeurs (> 100)", () => {
		expect(getLabelStep(101)).toBe(20);
		expect(getLabelStep(200)).toBe(20);
	});

	it("devrait retourner 40 pour 201 valeurs (> 200)", () => {
		expect(getLabelStep(201)).toBe(40);
		expect(getLabelStep(500)).toBe(40);
	});

	it("devrait retourner 100 pour 501 valeurs (> 500)", () => {
		expect(getLabelStep(501)).toBe(100);
		expect(getLabelStep(1000)).toBe(100);
	});
});
