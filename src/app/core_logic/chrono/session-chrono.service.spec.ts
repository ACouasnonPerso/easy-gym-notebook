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

describe("SessionChronoService — getElapsed()", () => {
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

	it("retourne 0 au démarrage", () => {
		expect(service.getElapsed()).toBe(0);
	});

	it("retourne la valeur courante de elapsedSeconds après tick", () => {
		service.start();
		jasmine.clock().tick(7000);
		expect(service.getElapsed()).toBe(7);
	});

	it("retourne la valeur gelée après pause", () => {
		service.start();
		jasmine.clock().tick(4000);
		service.pause();
		jasmine.clock().tick(10000);
		expect(service.getElapsed()).toBe(4);
	});
});

describe("SessionChronoService — persistance localStorage (session unique)", () => {
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

	it("start() écrit egn_chrono_start et supprime egn_chrono_paused", () => {
		localStorage.setItem("egn_chrono_paused", "10");
		service.start();
		expect(localStorage.getItem("egn_chrono_start")).not.toBeNull();
		expect(localStorage.getItem("egn_chrono_paused")).toBeNull();
	});

	it("pause() écrit egn_chrono_paused et supprime egn_chrono_start", () => {
		service.start();
		jasmine.clock().tick(5000);
		service.pause();
		expect(localStorage.getItem("egn_chrono_paused")).toBe("5");
		expect(localStorage.getItem("egn_chrono_start")).toBeNull();
	});

	it("resumeSession() écrit egn_chrono_start et supprime egn_chrono_paused", () => {
		service.start();
		jasmine.clock().tick(3000);
		service.pause();
		service.resumeSession();
		expect(localStorage.getItem("egn_chrono_start")).not.toBeNull();
		expect(localStorage.getItem("egn_chrono_paused")).toBeNull();
	});

	it("stop() supprime egn_chrono_start et egn_chrono_paused", () => {
		// Pré-positionner les deux clés simultanément pour détecter la suppression de chacune
		localStorage.setItem("egn_chrono_start", "1000");
		localStorage.setItem("egn_chrono_paused", "5");
		service.stop();
		expect(localStorage.getItem("egn_chrono_start")).toBeNull();
		expect(localStorage.getItem("egn_chrono_paused")).toBeNull();
	});

	it("overrideElapsed() écrit egn_chrono_start et supprime egn_chrono_paused", () => {
		service.start();
		jasmine.clock().tick(3000);
		service.pause();
		service.overrideElapsed(60);
		expect(localStorage.getItem("egn_chrono_start")).not.toBeNull();
		expect(localStorage.getItem("egn_chrono_paused")).toBeNull();
	});
});

describe("SessionChronoService — restauration depuis localStorage (session unique)", () => {
	afterEach(() => {
		jasmine.clock().uninstall();
	});

	it("restaure l'état paused depuis egn_chrono_paused", () => {
		localStorage.clear();
		localStorage.setItem("egn_chrono_paused", "42");
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
		});
		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(0));
		const svc = TestBed.inject(SessionChronoService);
		expect(svc.status()).toBe("paused");
		expect(svc.elapsedSeconds()).toBe(42);
	});

	it("restaure l'état running depuis egn_chrono_start et continue le comptage", () => {
		localStorage.clear();
		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(5000));
		localStorage.setItem("egn_chrono_start", "0");
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
		});
		const svc = TestBed.inject(SessionChronoService);
		expect(svc.status()).toBe("running");
		// L'intervalle calcule elapsed au prochain tick ; on avance d'une seconde
		jasmine.clock().tick(1000);
		// elapsed = floor((6000 - 0) / 1000) = 6
		expect(svc.elapsedSeconds()).toBe(6);
	});
});

describe("SessionChronoService — platform: server (session unique)", () => {
	let service: SessionChronoService;

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: "server" }],
		});
		service = TestBed.inject(SessionChronoService);
		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(0));
	});

	afterEach(() => {
		jasmine.clock().uninstall();
	});

	it("start() ne modifie pas localStorage", () => {
		service.start();
		expect(localStorage.getItem("egn_chrono_start")).toBeNull();
		expect(localStorage.getItem("egn_chrono_paused")).toBeNull();
	});

	it("pause() ne modifie pas localStorage", () => {
		service.start();
		jasmine.clock().tick(3000);
		service.pause();
		expect(localStorage.getItem("egn_chrono_paused")).toBeNull();
		expect(localStorage.getItem("egn_chrono_start")).toBeNull();
	});

	it("resumeSession() ne modifie pas localStorage", () => {
		service.start();
		service.pause();
		service.resumeSession();
		expect(localStorage.getItem("egn_chrono_start")).toBeNull();
		expect(localStorage.getItem("egn_chrono_paused")).toBeNull();
	});

	it("stop() ne modifie pas localStorage", () => {
		// Pré-positionner les clés pour détecter une suppression illégitime (mutation if(true))
		localStorage.setItem("egn_chrono_start", "1000");
		localStorage.setItem("egn_chrono_paused", "5");
		service.stop();
		expect(localStorage.getItem("egn_chrono_start")).toBe("1000");
		expect(localStorage.getItem("egn_chrono_paused")).toBe("5");
	});

	it("overrideElapsed() ne modifie pas localStorage", () => {
		service.start();
		service.overrideElapsed(60);
		expect(localStorage.getItem("egn_chrono_start")).toBeNull();
		expect(localStorage.getItem("egn_chrono_paused")).toBeNull();
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

describe("SessionChronoService — API multi-session", () => {
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

	describe("startForSession()", () => {
		it("démarre et compte le temps pour une session donnée", () => {
			service.startForSession("s1");
			jasmine.clock().tick(5000);
			expect(service.getElapsedForSession("s1")).toBe(5);
		});

		it("passe le statut à running", () => {
			service.startForSession("s1");
			expect(service.getStatusForSession("s1")).toBe("running");
		});

		it("est sans effet si la session est déjà running", () => {
			service.startForSession("s1");
			jasmine.clock().tick(10000);
			const elapsed = service.getElapsedForSession("s1");
			service.startForSession("s1");
			expect(service.getElapsedForSession("s1")).toBe(elapsed);
			expect(service.getStatusForSession("s1")).toBe("running");
		});

		it("est sans effet si la session a un pausedElapsed > 0 (restaurée depuis storage)", () => {
			localStorage.setItem("egn_chrono_paused_s1", "30");
			const svc2 = TestBed.inject(SessionChronoService);
			// elapsedSignalForSession déclenche _getOrCreateSession → restoreSessionFromStorage
			const elapsedBefore = svc2.elapsedSignalForSession("s1")();
			svc2.startForSession("s1");
			expect(svc2.getStatusForSession("s1")).toBe("paused");
			expect(svc2.elapsedSignalForSession("s1")()).toBe(elapsedBefore);
		});

		it("persiste la clé egn_chrono_start_{id} dans localStorage", () => {
			service.startForSession("s1");
			expect(localStorage.getItem("egn_chrono_start_s1")).not.toBeNull();
		});

		it("calcule correctement l'elapsed quand Date.now() est non nul au démarrage", () => {
			jasmine.clock().mockDate(new Date(5000));
			service.startForSession("s1");
			jasmine.clock().tick(3000);
			expect(service.getElapsedForSession("s1")).toBe(3);
		});
	});

	describe("pauseForSession()", () => {
		it("stoppe le comptage et passe le statut à paused", () => {
			service.startForSession("s1");
			jasmine.clock().tick(5000);
			service.pauseForSession("s1");
			expect(service.getStatusForSession("s1")).toBe("paused");
			const elapsed = service.getElapsedForSession("s1");
			jasmine.clock().tick(5000);
			expect(service.getElapsedForSession("s1")).toBe(elapsed);
		});

		it("sauvegarde le temps écoulé dans localStorage", () => {
			service.startForSession("s1");
			jasmine.clock().tick(8000);
			service.pauseForSession("s1");
			expect(localStorage.getItem("egn_chrono_paused_s1")).toBe("8");
			expect(localStorage.getItem("egn_chrono_start_s1")).toBeNull();
		});

		it("ne fait rien si la session n'existe pas", () => {
			expect(() => service.pauseForSession("inexistant")).not.toThrow();
		});
	});

	describe("resumeForSession()", () => {
		it("reprend le comptage depuis le temps sauvegardé", () => {
			service.startForSession("s1");
			jasmine.clock().tick(10000);
			service.pauseForSession("s1");
			service.resumeForSession("s1");
			expect(service.getStatusForSession("s1")).toBe("running");
			jasmine.clock().tick(5000);
			expect(service.getElapsedForSession("s1")).toBe(15);
		});

		it("persiste la clé egn_chrono_start_{id} dans localStorage", () => {
			service.startForSession("s1");
			service.pauseForSession("s1");
			service.resumeForSession("s1");
			expect(localStorage.getItem("egn_chrono_start_s1")).not.toBeNull();
			expect(localStorage.getItem("egn_chrono_paused_s1")).toBeNull();
		});

		it("supprime egn_chrono_ended_{id} du localStorage", () => {
			service.startForSession("s1");
			jasmine.clock().tick(5000);
			service.stopForSession("s1");
			expect(localStorage.getItem("egn_chrono_ended_s1")).not.toBeNull();
			service.resumeForSession("s1");
			expect(localStorage.getItem("egn_chrono_ended_s1")).toBeNull();
		});
	});

	describe("stopForSession()", () => {
		it("arrête le comptage et retourne le temps écoulé", () => {
			service.startForSession("s1");
			jasmine.clock().tick(7000);
			const returned = service.stopForSession("s1");
			expect(returned).toBe(7);
			expect(service.getStatusForSession("s1")).toBe("ended");
		});

		it("stoppe le comptage après arrêt", () => {
			service.startForSession("s1");
			jasmine.clock().tick(5000);
			service.stopForSession("s1");
			const elapsed = service.getElapsedForSession("s1");
			jasmine.clock().tick(5000);
			expect(service.getElapsedForSession("s1")).toBe(elapsed);
		});

		it("persiste la clé egn_chrono_ended_{id} dans localStorage", () => {
			service.startForSession("s1");
			jasmine.clock().tick(4000);
			service.stopForSession("s1");
			expect(localStorage.getItem("egn_chrono_ended_s1")).toBe("4");
			expect(localStorage.getItem("egn_chrono_start_s1")).toBeNull();
		});

		it("supprime egn_chrono_paused_{id} du localStorage", () => {
			service.startForSession("s1");
			jasmine.clock().tick(5000);
			service.pauseForSession("s1");
			expect(localStorage.getItem("egn_chrono_paused_s1")).not.toBeNull();
			service.stopForSession("s1");
			expect(localStorage.getItem("egn_chrono_paused_s1")).toBeNull();
		});

		it("retourne 0 si la session n'existe pas", () => {
			expect(service.stopForSession("inexistant")).toBe(0);
		});
	});

	describe("getElapsedForSession() / getStatusForSession()", () => {
		it("retourne 0 pour une session inconnue", () => {
			expect(service.getElapsedForSession("inconnu")).toBe(0);
		});

		it("retourne 'paused' pour une session inconnue", () => {
			expect(service.getStatusForSession("inconnu")).toBe("paused");
		});
	});

	describe("elapsedSignalForSession() / statusSignalForSession()", () => {
		it("le signal elapsed se met à jour en temps réel", () => {
			const elapsed = service.elapsedSignalForSession("s1");
			service.startForSession("s1");
			jasmine.clock().tick(3000);
			expect(elapsed()).toBe(3);
		});

		it("le signal status passe à running après startForSession()", () => {
			const status = service.statusSignalForSession("s1");
			expect(status()).toBe("paused");
			service.startForSession("s1");
			expect(status()).toBe("running");
		});
	});

	describe("overrideElapsedForSession()", () => {
		it("force le temps écoulé et reprend le comptage depuis cette valeur", () => {
			service.startForSession("s1");
			jasmine.clock().tick(5000);
			service.overrideElapsedForSession("s1", 120);
			expect(service.getElapsedForSession("s1")).toBe(120);
			expect(service.getStatusForSession("s1")).toBe("running");
			jasmine.clock().tick(3000);
			expect(service.getElapsedForSession("s1")).toBe(123);
		});

		it("persiste la nouvelle valeur dans localStorage", () => {
			service.startForSession("s1");
			service.pauseForSession("s1"); // positionne egn_chrono_paused_s1, supprime egn_chrono_start_s1
			service.overrideElapsedForSession("s1", 50);
			// start doit être re-positionné et paused supprimé
			expect(localStorage.getItem("egn_chrono_start_s1")).not.toBeNull();
			expect(localStorage.getItem("egn_chrono_paused_s1")).toBeNull();
		});
	});

	describe("restauration depuis localStorage (multi-session)", () => {
		it("restaure l'état paused depuis egn_chrono_paused_{id}", () => {
			localStorage.clear();
			localStorage.setItem("egn_chrono_paused_s42", "30");
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: "browser" }] });
			const svc = TestBed.inject(SessionChronoService);
			// statusSignalForSession déclenche _getOrCreateSession → restoreSessionFromStorage
			svc.statusSignalForSession("s42");
			expect(svc.getStatusForSession("s42")).toBe("paused");
			expect(svc.getElapsedForSession("s42")).toBe(30);
		});

		it("restaure l'état running depuis egn_chrono_start_{id} et continue le comptage", () => {
			localStorage.clear();
			jasmine.clock().mockDate(new Date(10000));
			// startTime = 5000 (non nul) pour distinguer soustraction et addition :
			// (10000 - 5000) / 1000 = 5  vs  (10000 + 5000) / 1000 = 15
			localStorage.setItem("egn_chrono_start_s42", "5000");
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: "browser" }] });
			const svc = TestBed.inject(SessionChronoService);
			// statusSignalForSession déclenche _getOrCreateSession → restoreSessionFromStorage
			svc.statusSignalForSession("s42");
			expect(svc.getStatusForSession("s42")).toBe("running");
			expect(svc.getElapsedForSession("s42")).toBe(5);
			// Vérifie aussi le callback de l'intervalle (ligne 250)
			jasmine.clock().tick(1000); // Date.now() = 11000 → (11000 - 5000) / 1000 = 6
			expect(svc.getElapsedForSession("s42")).toBe(6);
		});

		it("restaure l'état ended depuis egn_chrono_ended_{id}", () => {
			localStorage.clear();
			localStorage.setItem("egn_chrono_ended_s42", "45");
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: "browser" }] });
			const svc = TestBed.inject(SessionChronoService);
			// statusSignalForSession déclenche _getOrCreateSession → restoreSessionFromStorage
			svc.statusSignalForSession("s42");
			expect(svc.getStatusForSession("s42")).toBe("ended");
			expect(svc.getElapsedForSession("s42")).toBe(45);
		});
	});
});

describe("SessionChronoService — multi-session platform: server", () => {
	let service: SessionChronoService;

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			providers: [{ provide: PLATFORM_ID, useValue: "server" }],
		});
		service = TestBed.inject(SessionChronoService);
		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(0));
	});

	afterEach(() => {
		jasmine.clock().uninstall();
	});

	it("startForSession() ne modifie pas localStorage", () => {
		service.startForSession("s1");
		expect(localStorage.getItem("egn_chrono_start_s1")).toBeNull();
	});

	it("pauseForSession() ne modifie pas localStorage", () => {
		service.startForSession("s1");
		jasmine.clock().tick(3000);
		service.pauseForSession("s1");
		expect(localStorage.getItem("egn_chrono_paused_s1")).toBeNull();
		expect(localStorage.getItem("egn_chrono_start_s1")).toBeNull();
	});

	it("resumeForSession() ne modifie pas localStorage", () => {
		service.startForSession("s1");
		service.pauseForSession("s1");
		service.resumeForSession("s1");
		expect(localStorage.getItem("egn_chrono_start_s1")).toBeNull();
		expect(localStorage.getItem("egn_chrono_paused_s1")).toBeNull();
		expect(localStorage.getItem("egn_chrono_ended_s1")).toBeNull();
	});

	it("stopForSession() ne modifie pas localStorage", () => {
		service.startForSession("s1");
		jasmine.clock().tick(3000);
		service.stopForSession("s1");
		expect(localStorage.getItem("egn_chrono_ended_s1")).toBeNull();
		expect(localStorage.getItem("egn_chrono_start_s1")).toBeNull();
		expect(localStorage.getItem("egn_chrono_paused_s1")).toBeNull();
	});

	it("overrideElapsedForSession() ne modifie pas localStorage", () => {
		service.startForSession("s1");
		service.overrideElapsedForSession("s1", 60);
		expect(localStorage.getItem("egn_chrono_start_s1")).toBeNull();
		expect(localStorage.getItem("egn_chrono_paused_s1")).toBeNull();
	});
});
