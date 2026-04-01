import { TestBed } from "@angular/core/testing";
import { MassUnitService, MassUnit } from "./mass-unit.service";

describe("MassUnitService", () => {
	let service: MassUnitService;

	beforeEach(() => {
		localStorage.clear();
		Object.defineProperty(navigator, "language", { get: () => "fr-FR", configurable: true });

		TestBed.configureTestingModule({
			providers: [MassUnitService],
		});

		service = TestBed.inject(MassUnitService);
	});

	describe("état initial", () => {
		it("devrait exposer metric comme unité de masse active par défaut quand la locale est fr-FR", () => {
			Object.defineProperty(navigator, "language", { get: () => "fr-FR", configurable: true });
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: [MassUnitService] });
			const svc = TestBed.inject(MassUnitService);

			expect(svc.activeMassUnit()).toBe("metric");
		});

		it("devrait auto-détecter us quand la locale est en-US et localStorage est vide", () => {
			Object.defineProperty(navigator, "language", { get: () => "en-US", configurable: true });
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: [MassUnitService] });
			const svc = TestBed.inject(MassUnitService);

			expect(svc.activeMassUnit()).toBe("us");
		});

		it("devrait restaurer imperial depuis localStorage si la clé massUnit existe", () => {
			localStorage.setItem("massUnit", "imperial");
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: [MassUnitService] });
			const svc = TestBed.inject(MassUnitService);

			expect(svc.activeMassUnit()).toBe("imperial");
		});
	});

	describe("detect()", () => {
		it("devrait retourner metric pour une locale non-US non-GB quand localStorage est vide", () => {
			Object.defineProperty(navigator, "language", { get: () => "fr-FR", configurable: true });

			expect(service.detect()).toBe("metric");
		});

		it("devrait retourner us pour la locale en-US quand localStorage est vide", () => {
			Object.defineProperty(navigator, "language", { get: () => "en-US", configurable: true });

			expect(service.detect()).toBe("us");
		});

		it("devrait retourner imperial pour la locale en-GB quand localStorage est vide", () => {
			Object.defineProperty(navigator, "language", { get: () => "en-GB", configurable: true });

			expect(service.detect()).toBe("imperial");
		});

		it("devrait retourner la valeur stockée dans localStorage si la clé massUnit existe", () => {
			localStorage.setItem("massUnit", "imperial");
			Object.defineProperty(navigator, "language", { get: () => "en-US", configurable: true });

			expect(service.detect()).toBe("imperial");
		});
	});

	describe("setMassUnit()", () => {
		it("devrait mettre à jour le signal activeMassUnit", () => {
			service.setMassUnit("imperial");

			expect(service.activeMassUnit()).toBe("imperial");
		});

		it("devrait persister la valeur dans localStorage sous la clé massUnit", () => {
			service.setMassUnit("imperial");

			expect(localStorage.getItem("massUnit")).toBe("imperial");
		});

		it("ne devrait pas écrire dans localStorage si l'unité est déjà active", () => {
			service.setMassUnit("imperial");
			localStorage.clear();

			service.setMassUnit("imperial");

			expect(localStorage.getItem("massUnit")).toBeNull();
		});
	});

	describe("setMassUnit() — vérifications supplémentaires", () => {
		it("met à jour le signal vers 'us'", () => {
			service.setMassUnit("us");
			expect(service.activeMassUnit()).toBe("us");
		});

		it("met à jour le signal vers 'metric'", () => {
			service.setMassUnit("imperial");
			service.setMassUnit("metric");
			expect(service.activeMassUnit()).toBe("metric");
		});

		it("écrit 'us' dans localStorage sous la clé massUnit", () => {
			service.setMassUnit("us");
			expect(localStorage.getItem("massUnit")).toBe("us");
		});

		it("écrit 'metric' dans localStorage sous la clé massUnit", () => {
			service.setMassUnit("imperial");
			service.setMassUnit("metric");
			expect(localStorage.getItem("massUnit")).toBe("metric");
		});

		it("ne modifie pas le signal si l'unité est déjà active (metric → metric)", () => {
			Object.defineProperty(navigator, "language", { get: () => "fr-FR", configurable: true });
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: [MassUnitService] });
			const svc = TestBed.inject(MassUnitService);
			expect(svc.activeMassUnit()).toBe("metric");

			svc.setMassUnit("metric");
			expect(svc.activeMassUnit()).toBe("metric");
			expect(localStorage.getItem("massUnit")).toBeNull(); // pas d'écriture
		});
	});

	describe("detect() — vérifications de clé localStorage", () => {
		it("lit bien depuis la clé 'massUnit' (pas une autre clé)", () => {
			localStorage.setItem("massUnit", "us");
			expect(service.detect()).toBe("us");
		});

		it("retourne 'us' pour en-US et non une autre valeur", () => {
			Object.defineProperty(navigator, "language", { get: () => "en-US", configurable: true });
			expect(service.detect()).toBe("us");
		});

		it("retourne 'imperial' pour en-GB et non une autre valeur", () => {
			Object.defineProperty(navigator, "language", { get: () => "en-GB", configurable: true });
			expect(service.detect()).toBe("imperial");
		});

		it("retourne 'metric' pour toute locale autre que en-US et en-GB", () => {
			Object.defineProperty(navigator, "language", { get: () => "de-DE", configurable: true });
			expect(service.detect()).toBe("metric");
		});

		it("la valeur localStorage a priorité sur la locale en-US", () => {
			localStorage.setItem("massUnit", "metric");
			Object.defineProperty(navigator, "language", { get: () => "en-US", configurable: true });
			expect(service.detect()).toBe("metric");
		});

		it("la valeur localStorage a priorité sur la locale en-GB", () => {
			localStorage.setItem("massUnit", "us");
			Object.defineProperty(navigator, "language", { get: () => "en-GB", configurable: true });
			expect(service.detect()).toBe("us");
		});
	});

	describe("état initial — en-GB", () => {
		it("auto-détecte imperial quand la locale est en-GB", () => {
			Object.defineProperty(navigator, "language", { get: () => "en-GB", configurable: true });
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: [MassUnitService] });
			const svc = TestBed.inject(MassUnitService);
			expect(svc.activeMassUnit()).toBe("imperial");
		});
	});
});
