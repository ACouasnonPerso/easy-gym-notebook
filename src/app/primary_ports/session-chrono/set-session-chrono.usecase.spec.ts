import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SetSessionChronoUseCase } from './set-session-chrono.usecase';
import { SessionChronoService } from '../../core_logic/chrono/session-chrono.service';

describe('SetSessionChronoUseCase', () => {
  let useCase: SetSessionChronoUseCase;
  let chronoService: SessionChronoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    useCase = TestBed.inject(SetSessionChronoUseCase);
    chronoService = TestBed.inject(SessionChronoService);
  });

  it('should delegate to SessionChronoService.overrideElapsed with the given seconds', () => {
    spyOn(chronoService, 'overrideElapsed');

    useCase.execute(3600);

    expect(chronoService.overrideElapsed).toHaveBeenCalledOnceWith(3600);
  });

  it('should delegate executeForSession to SessionChronoService.overrideElapsedForSession', () => {
    spyOn(chronoService, 'overrideElapsedForSession');

    useCase.executeForSession('session-42', 7200);

    expect(chronoService.overrideElapsedForSession).toHaveBeenCalledOnceWith('session-42', 7200);
  });
});
