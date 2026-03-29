import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { CardioPaceChartComponent } from './cardio-pace-chart.component';
import { CardioOccurrence } from '../../core_logic/shared/models';
import { MassUnitService } from '../../core_logic/mass-unit/mass-unit.service';

@Component({
  standalone: true,
  imports: [CardioPaceChartComponent],
  template: `<app-cardio-pace-chart [occurrences]="occurrences" />`,
})
class HostComponent {
  occurrences: CardioOccurrence[] = [];
}

function makeOccurrence(distanceKm: number | null, durationSeconds: number, date = new Date(2026, 0, 1)): CardioOccurrence {
  return { date, durationSeconds, distanceKm };
}

describe('CardioPaceChartComponent', () => {
  function setup(occurrences: CardioOccurrence[], unit: 'metric' | 'imperial' | 'us' = 'metric') {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideTranslateService({ defaultLanguage: 'fr' }),
        { provide: MassUnitService, useValue: { activeMassUnit: signal(unit) } },
      ],
    });
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.componentInstance.occurrences = occurrences;
    fixture.detectChanges();
    return fixture;
  }

  it('should return null chartData when no occurrences have distance > 0', () => {
    const fixture = setup([makeOccurrence(null, 1800), makeOccurrence(0, 1800)]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-chart')).not.toBeNull();
    expect(el.querySelectorAll('circle').length).toBe(0);
  });

  it('should compute metric pace: 1800s over 6km = 5:00/km', () => {
    const fixture = setup([makeOccurrence(6, 1800)], 'metric');
    const el: HTMLElement = fixture.nativeElement;
    const texts = Array.from(el.querySelectorAll('text')).map(t => t.textContent?.trim());
    expect(texts).toContain('5:00/km');
  });

  it('should compute imperial pace: 1800s over 6km -> ~8:03/mi', () => {
    const fixture = setup([makeOccurrence(6, 1800)], 'imperial');
    const el: HTMLElement = fixture.nativeElement;
    const texts = Array.from(el.querySelectorAll('text')).map(t => t.textContent?.trim());
    expect(texts).toContain('8:03/mi');
  });
});
