import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EditDurationPopupComponent } from './edit-duration-popup.component';
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<TranslationObject> {
    return of({} as TranslationObject);
  }
}
const translateModuleConfig = TranslateModule.forRoot({
  loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n(): void {
  const translate = TestBed.inject(TranslateService);
  translate.setDefaultLang('fr');
  translate.use('fr');
}

describe('EditDurationPopupComponent', () => {
  function createComponent(initialSeconds: number) {
    TestBed.configureTestingModule({
      imports: [EditDurationPopupComponent, translateModuleConfig],
    });
    setupI18n();
    const fixture = TestBed.createComponent(EditDurationPopupComponent);
    fixture.componentRef.setInput('initialSeconds', initialSeconds);
    fixture.detectChanges();
    return fixture;
  }

  it('affiche 3 drum-pickers pour les heures, minutes et secondes', () => {
    const fixture = createComponent(0);

    const pickers = fixture.debugElement.queryAll(By.css('app-drum-picker'));

    expect(pickers.length).toBe(3);
  });

  it('initialise les pickers heures, minutes et secondes depuis initialSeconds (3723s = 1h 2m 3s)', () => {
    const fixture = createComponent(3723); // 1h 2m 3s

    const pickers = fixture.debugElement.queryAll(By.css('app-drum-picker'));
    const hoursSelected = pickers[0].componentInstance.selectedValue();
    const minutesSelected = pickers[1].componentInstance.selectedValue();
    const secondsSelected = pickers[2].componentInstance.selectedValue();

    expect(hoursSelected).toBe(1);
    expect(minutesSelected).toBe(2);
    expect(secondsSelected).toBe(3);
  });

  it('emet la valeur totale en secondes lors de la confirmation', () => {
    const fixture = createComponent(0);
    const component = fixture.componentInstance;
    let emittedValue: number | undefined;
    fixture.componentRef.instance.confirmed.subscribe((v: number) => emittedValue = v);

    component.onHoursChange(1);
    component.onMinutesChange(30);
    component.onSecondsChange(15);
    component.onConfirm();

    expect(emittedValue).toBe(1 * 3600 + 30 * 60 + 15); // 5415
  });

  it('emet l\'evenement cancelled lors du clic sur Annuler', () => {
    const fixture = createComponent(0);
    let cancelCalled = false;
    fixture.componentRef.instance.cancelled.subscribe(() => cancelCalled = true);

    const cancelBtn = fixture.debugElement.query(By.css('.btn-cancel'));
    cancelBtn.triggerEventHandler('click', null);

    expect(cancelCalled).toBeTrue();
  });
});
