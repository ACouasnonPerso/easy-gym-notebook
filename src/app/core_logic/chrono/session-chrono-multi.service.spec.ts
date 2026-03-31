import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { SessionChronoService } from "./session-chrono.service";

describe("SessionChronoService — multi-session API", () => {
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

	// ---------------------------------------------------------------------------
	// startForSession
	// ---------------------------------------------------------------------------

	describe("startForSession()", () => {
		it("should set the session status to running after startForSession", () => {
			service.startForSession("session-1");

			expect(service.getStatusForSession("session-1")).toBe("running");
		});

		it("should increment elapsed every second while running", () => {
			service.startForSession("session-1");

			expect(service.getElapsedForSession("session-1")).toBe(0);
			jasmine.clock().tick(1000);
			expect(service.getElapsedForSession("session-1")).toBe(1);
			jasmine.clock().tick(1000);
			expect(service.getElapsedForSession("session-1")).toBe(2);
		});
	});

	// ---------------------------------------------------------------------------
	// pauseForSession
	// ---------------------------------------------------------------------------

	describe("pauseForSession()", () => {
		it("should set status to paused and stop the elapsed counter", () => {
			service.startForSession("session-1");
			jasmine.clock().tick(3000);

			service.pauseForSession("session-1");

			expect(service.getStatusForSession("session-1")).toBe("paused");
			const elapsed = service.getElapsedForSession("session-1");
			jasmine.clock().tick(5000);
			expect(service.getElapsedForSession("session-1")).toBe(elapsed);
		});
	});

	// ---------------------------------------------------------------------------
	// resumeForSession
	// ---------------------------------------------------------------------------

	describe("resumeForSession()", () => {
		it("should resume from paused elapsed and continue incrementing", () => {
			service.startForSession("session-1");
			jasmine.clock().tick(3000);
			service.pauseForSession("session-1");
			const elapsedAtPause = service.getElapsedForSession("session-1");

			service.resumeForSession("session-1");

			expect(service.getStatusForSession("session-1")).toBe("running");
			jasmine.clock().tick(2000);
			expect(service.getElapsedForSession("session-1")).toBe(elapsedAtPause + 2);
		});
	});

	// ---------------------------------------------------------------------------
	// stopForSession
	// ---------------------------------------------------------------------------

	describe("stopForSession()", () => {
		it("should return elapsed, set status to ended, and stop the counter", () => {
			service.startForSession("session-1");
			jasmine.clock().tick(4000);

			const returned = service.stopForSession("session-1");

			expect(returned).toBe(4);
			expect(service.getStatusForSession("session-1")).toBe("ended");
			const elapsed = service.getElapsedForSession("session-1");
			jasmine.clock().tick(3000);
			expect(service.getElapsedForSession("session-1")).toBe(elapsed);
		});
	});

	// ---------------------------------------------------------------------------
	// elapsedSignalForSession / statusSignalForSession
	// ---------------------------------------------------------------------------

	describe("elapsedSignalForSession()", () => {
		it("should return a reactive signal that reflects the ticking elapsed", () => {
			service.startForSession("session-1");
			const elapsedSignal = service.elapsedSignalForSession("session-1");

			jasmine.clock().tick(2000);

			expect(elapsedSignal()).toBe(2);
		});
	});

	describe("statusSignalForSession()", () => {
		it("should return a reactive signal that reflects the current status", () => {
			service.startForSession("session-1");
			const statusSignal = service.statusSignalForSession("session-1");

			expect(statusSignal()).toBe("running");

			service.pauseForSession("session-1");

			expect(statusSignal()).toBe("paused");
		});
	});

	// ---------------------------------------------------------------------------
	// Reopen scenario — app close + reopen + resume
	// ---------------------------------------------------------------------------

	describe("reopen scenario", () => {
		it("should restore a running session from localStorage and keep ticking after app reopen", () => {
			// Before close: session was running for 10 seconds.
			service.startForSession("session-1");
			jasmine.clock().tick(10000);

			// App closes: service is destroyed and recreated (new TestBed instance).
			jasmine.clock().uninstall();
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
			});
			const reopenedService = TestBed.inject(SessionChronoService);
			jasmine.clock().install();
			jasmine.clock().mockDate(new Date(10000)); // clock at 10s (same real time as when app closed)

			// On reopen, statusSignalForSession is read by the component's computed.
			const statusSignal = reopenedService.statusSignalForSession("session-1");

			// The session should be restored as 'running' from localStorage.
			expect(statusSignal()).toBe("running");
			expect(reopenedService.getElapsedForSession("session-1")).toBe(10);

			// Timer should keep ticking without any extra action.
			jasmine.clock().tick(2000);
			expect(reopenedService.getElapsedForSession("session-1")).toBe(12);
		});

		it("should restore a paused session from localStorage after app reopen, then tick correctly when resumed", () => {
			// Before close: session was running for 10s, then paused at 10s.
			service.startForSession("session-1");
			jasmine.clock().tick(10000);
			service.pauseForSession("session-1");

			// App closes and reopens.
			jasmine.clock().uninstall();
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
			});
			const reopenedService = TestBed.inject(SessionChronoService);
			jasmine.clock().install();
			jasmine.clock().mockDate(new Date(15000)); // 5 extra seconds passed while app was closed

			// Component's computed reads the status signal (simulates UI binding).
			const statusSignal = reopenedService.statusSignalForSession("session-1");

			// Session should be restored as 'paused' at elapsed=10 (paused time doesn't count).
			expect(statusSignal()).toBe("paused");
			expect(reopenedService.getElapsedForSession("session-1")).toBe(10);

			// User clicks resume: timer should continue ticking from 10.
			reopenedService.resumeForSession("session-1");

			expect(statusSignal()).toBe("running");
			jasmine.clock().tick(3000);
			expect(reopenedService.getElapsedForSession("session-1")).toBe(13);
		});
	});

	// ---------------------------------------------------------------------------
	// Resume after stop (ended → running)
	// ---------------------------------------------------------------------------

	describe("resumeForSession() after stopForSession()", () => {
		it("should resume from the stopped elapsed and continue incrementing", () => {
			service.startForSession("session-1");
			jasmine.clock().tick(5000);
			service.stopForSession("session-1");

			service.resumeForSession("session-1");

			expect(service.getStatusForSession("session-1")).toBe("running");
			jasmine.clock().tick(3000);
			expect(service.getElapsedForSession("session-1")).toBe(8);
		});

		it("should resume from the stopped elapsed after a page reload (restored from localStorage)", () => {
			// Session runs for 7 seconds, then is stopped.
			service.startForSession("session-1");
			jasmine.clock().tick(7000);
			service.stopForSession("session-1");

			// App reloads: service instance is destroyed and recreated.
			jasmine.clock().uninstall();
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
			});
			const reloadedService = TestBed.inject(SessionChronoService);
			jasmine.clock().install();
			jasmine.clock().mockDate(new Date(10000)); // some time has passed

			// User navigates back to the session and clicks Reprendre.
			reloadedService.resumeForSession("session-1");

			expect(reloadedService.getStatusForSession("session-1")).toBe("running");
			// After 2 more seconds, elapsed should be 7 + 2 = 9, not 0 + 2 = 2.
			jasmine.clock().tick(2000);
			expect(reloadedService.getElapsedForSession("session-1")).toBe(9);
		});
	});

	// ---------------------------------------------------------------------------
	// Session isolation — the core requirement
	// ---------------------------------------------------------------------------

	describe("session isolation", () => {
		it("should run two sessions independently — pausing one does not affect the other", () => {
			service.startForSession("session-1");
			service.startForSession("session-2");

			jasmine.clock().tick(3000);
			service.pauseForSession("session-1");

			jasmine.clock().tick(2000);

			// session-1 was paused after 3s, should still be at 3
			expect(service.getElapsedForSession("session-1")).toBe(3);
			expect(service.getStatusForSession("session-1")).toBe("paused");

			// session-2 kept running for 5s total
			expect(service.getElapsedForSession("session-2")).toBe(5);
			expect(service.getStatusForSession("session-2")).toBe("running");
		});

		it("should run two sessions independently — stopping one does not affect the other", () => {
			service.startForSession("session-1");
			service.startForSession("session-2");

			jasmine.clock().tick(4000);
			const stopped = service.stopForSession("session-1");

			jasmine.clock().tick(2000);

			expect(stopped).toBe(4);
			expect(service.getStatusForSession("session-1")).toBe("ended");

			// session-2 kept running for 6s total
			expect(service.getElapsedForSession("session-2")).toBe(6);
			expect(service.getStatusForSession("session-2")).toBe("running");
		});
	});
});
