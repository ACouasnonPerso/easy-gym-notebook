import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { SessionChronoService } from "./session-chrono.service";

describe("SessionChronoService", () => {
	let service: SessionChronoService;

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
		});
		service = TestBed.inject(SessionChronoService);
		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(0));
	});

	afterEach(() => {
		jasmine.clock().uninstall();
	});

	describe("statut initial", () => {
		it("devrait démarrer avec le statut running", () => {
			expect(service.status()).toBe("running");
		});
	});

	describe("incrément du compteur", () => {
		it("devrait incrémenter elapsedSeconds de 1 toutes les secondes en statut running", () => {
			service.start();
			expect(service.elapsedSeconds()).toBe(0);
			jasmine.clock().tick(1000);
			expect(service.elapsedSeconds()).toBe(1);
			jasmine.clock().tick(1000);
			expect(service.elapsedSeconds()).toBe(2);
		});
	});

	describe("pause()", () => {
		it("devrait passer le statut à paused et stopper l'incrément", () => {
			service.start();
			jasmine.clock().tick(3000);
			service.pause();

			expect(service.status()).toBe("paused");
			const elapsed = service.elapsedSeconds();
			jasmine.clock().tick(5000);
			expect(service.elapsedSeconds()).toBe(elapsed);
		});
	});

	describe("resumeSession()", () => {
		it("devrait repasser en running et continuer l'incrément à partir de la durée sauvegardée", () => {
			service.start();
			jasmine.clock().tick(3000);
			service.pause();
			const elapsedAtPause = service.elapsedSeconds();

			service.resumeSession();

			expect(service.status()).toBe("running");
			jasmine.clock().tick(2000);
			expect(service.elapsedSeconds()).toBe(elapsedAtPause + 2);
		});
	});

	describe("stop()", () => {
		it("devrait passer le statut à ended et stopper l'incrément", () => {
			service.start();
			jasmine.clock().tick(4000);
			const returned = service.stop();

			expect(service.status()).toBe("ended");
			expect(returned).toBe(4);
			const elapsed = service.elapsedSeconds();
			jasmine.clock().tick(3000);
			expect(service.elapsedSeconds()).toBe(elapsed);
		});
	});

	describe("overrideElapsed()", () => {
		it("should set elapsedSeconds to the given value and keep running from there", () => {
			service.start();
			jasmine.clock().tick(5000);

			service.overrideElapsed(120);

			expect(service.elapsedSeconds()).toBe(120);
			expect(service.status()).toBe("running");
			jasmine.clock().tick(3000);
			expect(service.elapsedSeconds()).toBe(123);
		});
	});

	describe("start() depuis ended", () => {
		it("devrait repassser en running avec le compteur remis à zéro", () => {
			service.start();
			jasmine.clock().tick(5000);
			service.stop();

			service.start();

			expect(service.status()).toBe("running");
			expect(service.elapsedSeconds()).toBe(0);
			jasmine.clock().tick(2000);
			expect(service.elapsedSeconds()).toBe(2);
		});
	});
});

describe("SessionChronoService — startForSession idempotence", () => {
	let service: SessionChronoService;

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
		});
		service = TestBed.inject(SessionChronoService);
		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(0));
	});

	afterEach(() => {
		jasmine.clock().uninstall();
	});

	it("does not reset elapsed if startForSession is called again while already running", () => {
		service.startForSession("session-1");
		jasmine.clock().tick(10000);
		const elapsedBeforeSecondCall = service.getElapsedForSession("session-1");

		service.startForSession("session-1");

		expect(service.getElapsedForSession("session-1")).toBe(elapsedBeforeSecondCall);
		expect(service.getStatusForSession("session-1")).toBe("running");
	});
});
