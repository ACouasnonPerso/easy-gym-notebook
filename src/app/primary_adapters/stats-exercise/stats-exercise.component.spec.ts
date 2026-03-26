import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StatsExerciseComponent } from './stats-exercise.component';
import { GetExerciseStatsUseCase } from '../../primary_ports/stats-exercise/get-exercise-stats.usecase';
import { ChartSelectionService } from './chart-selection.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

function makeUseCaseSpy() {
  return {
    occurrences: signal([]),
    execute: jasmine.createSpy('execute').and.returnValue(Promise.resolve()),
  };
}

describe("StatsExerciseComponent — sélecteur de graphique", () => {
  let fixture: ComponentFixture<StatsExerciseComponent>;
  let chartSelectionService: ChartSelectionService;

  function setup(selectedChart: 'volume' | 'weight' = 'volume') {
    localStorage.clear();
    if (selectedChart === 'weight') localStorage.setItem('chart-selection', 'weight');

    TestBed.configureTestingModule({
      imports: [StatsExerciseComponent],
      providers: [
        { provide: GetExerciseStatsUseCase, useValue: makeUseCaseSpy() },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { exerciseName: 'Squat' } } } },
        { provide: Location, useValue: { back: jasmine.createSpy('back') } },
      ],
    });

    fixture = TestBed.createComponent(StatsExerciseComponent);
    chartSelectionService = TestBed.inject(ChartSelectionService);
    fixture.detectChanges();
  }

  it('devrait afficher un sélecteur avec les options Volume et Poids', () => {
    setup();

    const el: HTMLElement = fixture.nativeElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    const labels = buttons.map(b => b.textContent?.trim());

    expect(labels).toContain('Volume');
    expect(labels).toContain('Poids');
  });

  it('devrait afficher le graphique Volume par défaut (app-volume-line-chart visible)', () => {
    setup('volume');

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-volume-line-chart')).not.toBeNull();
    expect(el.querySelector('app-weight-line-chart')).toBeNull();
  });

  it('devrait afficher le graphique Poids quand "weight" est sélectionné dans le localStorage', () => {
    setup('weight');

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-weight-line-chart')).not.toBeNull();
    expect(el.querySelector('app-volume-line-chart')).toBeNull();
  });
});
