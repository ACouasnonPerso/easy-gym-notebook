import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ChronoActionsComponent } from './chrono-actions.component';
import { HapticService } from '../../core_logic/shared/haptic.service';

function createComponent(chronoState: string) {
  const hapticSpy = jasmine.createSpyObj<HapticService>('HapticService', ['vibrate']);

  TestBed.configureTestingModule({
    imports: [ChronoActionsComponent],
    providers: [
      { provide: HapticService, useValue: hapticSpy },
      provideTranslateService({ defaultLanguage: 'fr' }),
    ],
  });

  const fixture = TestBed.createComponent(ChronoActionsComponent);
  fixture.componentRef.setInput('chronoState', chronoState);
  fixture.detectChanges();

  return { fixture, hapticSpy };
}

describe('ChronoActionsComponent — haptic feedback sur +15s et +30s', () => {
  it('cliquer sur +15s appelle hapticService.vibrate()', () => {
    const { fixture, hapticSpy } = createComponent('break');

    const btns = fixture.debugElement.queryAll(By.css('.add-time-btn'));
    const btn15 = btns.find(b => b.nativeElement.textContent.trim() === '+15s')!;
    btn15.triggerEventHandler('click', null);

    expect(hapticSpy.vibrate).toHaveBeenCalledTimes(1);
  });

  it('cliquer sur +30s appelle hapticService.vibrate()', () => {
    const { fixture, hapticSpy } = createComponent('break');

    const btns = fixture.debugElement.queryAll(By.css('.add-time-btn'));
    const btn30 = btns.find(b => b.nativeElement.textContent.trim() === '+30s')!;
    btn30.triggerEventHandler('click', null);

    expect(hapticSpy.vibrate).toHaveBeenCalledTimes(1);
  });
});
