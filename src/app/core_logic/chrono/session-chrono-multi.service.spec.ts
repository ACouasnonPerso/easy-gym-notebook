import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SessionChronoService } from './session-chrono.service';

describe('SessionChronoService — multi-session API', () => {
  let service: SessionChronoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
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

  describe('startForSession()', () => {
    it('should set the session status to running after startForSession', () => {
      service.startForSession('session-1');

      expect(service.getStatusForSession('session-1')).toBe('running');
    });

    it('should increment elapsed every second while running', () => {
      service.startForSession('session-1');

      expect(service.getElapsedForSession('session-1')).toBe(0);
      jasmine.clock().tick(1000);
      expect(service.getElapsedForSession('session-1')).toBe(1);
      jasmine.clock().tick(1000);
      expect(service.getElapsedForSession('session-1')).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // pauseForSession
  // ---------------------------------------------------------------------------

  describe('pauseForSession()', () => {
    it('should set status to paused and stop the elapsed counter', () => {
      service.startForSession('session-1');
      jasmine.clock().tick(3000);

      service.pauseForSession('session-1');

      expect(service.getStatusForSession('session-1')).toBe('paused');
      const elapsed = service.getElapsedForSession('session-1');
      jasmine.clock().tick(5000);
      expect(service.getElapsedForSession('session-1')).toBe(elapsed);
    });
  });

  // ---------------------------------------------------------------------------
  // resumeForSession
  // ---------------------------------------------------------------------------

  describe('resumeForSession()', () => {
    it('should resume from paused elapsed and continue incrementing', () => {
      service.startForSession('session-1');
      jasmine.clock().tick(3000);
      service.pauseForSession('session-1');
      const elapsedAtPause = service.getElapsedForSession('session-1');

      service.resumeForSession('session-1');

      expect(service.getStatusForSession('session-1')).toBe('running');
      jasmine.clock().tick(2000);
      expect(service.getElapsedForSession('session-1')).toBe(elapsedAtPause + 2);
    });
  });

  // ---------------------------------------------------------------------------
  // stopForSession
  // ---------------------------------------------------------------------------

  describe('stopForSession()', () => {
    it('should return elapsed, set status to ended, and stop the counter', () => {
      service.startForSession('session-1');
      jasmine.clock().tick(4000);

      const returned = service.stopForSession('session-1');

      expect(returned).toBe(4);
      expect(service.getStatusForSession('session-1')).toBe('ended');
      const elapsed = service.getElapsedForSession('session-1');
      jasmine.clock().tick(3000);
      expect(service.getElapsedForSession('session-1')).toBe(elapsed);
    });
  });

  // ---------------------------------------------------------------------------
  // elapsedSignalForSession / statusSignalForSession
  // ---------------------------------------------------------------------------

  describe('elapsedSignalForSession()', () => {
    it('should return a reactive signal that reflects the ticking elapsed', () => {
      service.startForSession('session-1');
      const elapsedSignal = service.elapsedSignalForSession('session-1');

      jasmine.clock().tick(2000);

      expect(elapsedSignal()).toBe(2);
    });
  });

  describe('statusSignalForSession()', () => {
    it('should return a reactive signal that reflects the current status', () => {
      service.startForSession('session-1');
      const statusSignal = service.statusSignalForSession('session-1');

      expect(statusSignal()).toBe('running');

      service.pauseForSession('session-1');

      expect(statusSignal()).toBe('paused');
    });
  });

  // ---------------------------------------------------------------------------
  // Session isolation — the core requirement
  // ---------------------------------------------------------------------------

  describe('session isolation', () => {
    it('should run two sessions independently — pausing one does not affect the other', () => {
      service.startForSession('session-1');
      service.startForSession('session-2');

      jasmine.clock().tick(3000);
      service.pauseForSession('session-1');

      jasmine.clock().tick(2000);

      // session-1 was paused after 3s, should still be at 3
      expect(service.getElapsedForSession('session-1')).toBe(3);
      expect(service.getStatusForSession('session-1')).toBe('paused');

      // session-2 kept running for 5s total
      expect(service.getElapsedForSession('session-2')).toBe(5);
      expect(service.getStatusForSession('session-2')).toBe('running');
    });

    it('should run two sessions independently — stopping one does not affect the other', () => {
      service.startForSession('session-1');
      service.startForSession('session-2');

      jasmine.clock().tick(4000);
      const stopped = service.stopForSession('session-1');

      jasmine.clock().tick(2000);

      expect(stopped).toBe(4);
      expect(service.getStatusForSession('session-1')).toBe('ended');

      // session-2 kept running for 6s total
      expect(service.getElapsedForSession('session-2')).toBe(6);
      expect(service.getStatusForSession('session-2')).toBe('running');
    });
  });
});
