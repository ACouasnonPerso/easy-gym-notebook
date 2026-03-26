import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StatsGlobalComponent } from './stats-global.component';
import { GetGlobalStatsUseCase } from '../../primary_ports/stats-global/get-global-stats.usecase';
import { SelectMonthUseCase } from '../../primary_ports/stats-global/select-month.usecase';
import { MergeExercisesUseCase } from '../../primary_ports/stats-global/merge-exercises.usecase';
import { Router } from '@angular/router';

function makeGetGlobalStatsUseCaseSpy() {
  return {
    heatmapData: signal([]),
    monthSummary: signal({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 }),
    weekSummary: signal({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 }),
    weeklyAverage: signal({ avgWeightKg: 0, sessionsPerWeek: 0, avgDurationSeconds: 0 }),
    muscleGroupDistribution: signal([]),
    exerciseSummaries: signal([]),
    selectedMonth: signal(new Date()),
    execute: jasmine.createSpy('execute').and.returnValue(Promise.resolve()),
  };
}

function makeMergeExercisesUseCaseSpy() {
  return {
    execute: jasmine.createSpy('execute').and.returnValue(Promise.resolve()),
  };
}

function makeProviders(overrides: { exerciseSummaries?: ReturnType<typeof signal<{ name: string; maxWeightKg: number; totalVolumeKg: number; occurrenceCount: number }[]>> } = {}) {
  const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
  if (overrides.exerciseSummaries) {
    statsUseCaseSpy.exerciseSummaries = overrides.exerciseSummaries as any;
  }
  return {
    statsUseCaseSpy,
    selectMonthUseCaseSpy: { execute: jasmine.createSpy('execute') },
    mergeUseCaseSpy: makeMergeExercisesUseCaseSpy(),
    routerSpy: { navigate: jasmine.createSpy('navigate') },
  };
}

describe("StatsGlobalComponent — formatDuration", () => {
  let component: StatsGlobalComponent;

  beforeEach(() => {
    const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
    const selectMonthUseCaseSpy = { execute: jasmine.createSpy('execute') };
    const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
    const routerSpy = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [StatsGlobalComponent],
      providers: [
        { provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
        { provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
        { provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    component = TestBed.createComponent(StatsGlobalComponent).componentInstance;
  });

  it('devrait afficher "0min" pour une durée de zéro seconde', () => {
    expect(component.formatDuration(0)).toBe('0min');
  });

  it('devrait afficher "11min" pour 660 secondes (11 minutes)', () => {
    expect(component.formatDuration(660)).toBe('11min');
  });

  it('devrait afficher "1h1" pour 3660 secondes (1h01 — sans zéro de remplissage)', () => {
    expect(component.formatDuration(3660)).toBe('1h1');
  });

  it('devrait afficher "1h10" pour 4200 secondes (1 heure 10 minutes)', () => {
    expect(component.formatDuration(4200)).toBe('1h10');
  });
});

describe("StatsGlobalComponent — sélecteur de vue (année en cours et total)", () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StatsGlobalComponent>>;

  beforeEach(() => {
    const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
    const selectMonthUseCaseSpy = { execute: jasmine.createSpy('execute') };
    const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
    const routerSpy = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [StatsGlobalComponent],
      providers: [
        { provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
        { provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
        { provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    fixture = TestBed.createComponent(StatsGlobalComponent);
    fixture.componentInstance.showDropdown.set(true);
    fixture.detectChanges();
  });

  it("devrait inclure 'Année en cours' et 'Total' dans la liste des options", () => {
    const el: HTMLElement = fixture.nativeElement;
    const items = Array.from(el.querySelectorAll('.dropdown-item')).map(i => i.textContent?.trim());

    expect(items).toContain('Année en cours');
    expect(items).toContain('Total');
  });

  it("devrait afficher la heatmap quand un mois normal est sélectionné (index 2)", () => {
    fixture.componentInstance.selectedMonthIndex.set(2);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const heatmapCard = Array.from(el.querySelectorAll('.stats-card-title'))
      .find(t => t.textContent?.trim() === 'Training recurrences');

    expect(heatmapCard).toBeTruthy();
  });

  it("devrait masquer la heatmap quand 'Année en cours' est sélectionné (index 0)", () => {
    fixture.componentInstance.selectedMonthIndex.set(0);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const heatmapCard = Array.from(el.querySelectorAll('.stats-card-title'))
      .find(t => t.textContent?.trim() === 'Training recurrences');

    expect(heatmapCard).toBeUndefined();
  });

  it("devrait masquer la heatmap quand 'Total' est sélectionné (index 1)", () => {
    fixture.componentInstance.selectedMonthIndex.set(1);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const heatmapCard = Array.from(el.querySelectorAll('.stats-card-title'))
      .find(t => t.textContent?.trim() === 'Training recurrences');

    expect(heatmapCard).toBeUndefined();
  });
});

describe("StatsGlobalComponent — résumé de la semaine", () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StatsGlobalComponent>>;

  function setup(monthIndex: number) {
    const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
    const selectMonthUseCaseSpy = { execute: jasmine.createSpy('execute') };
    const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
    const routerSpy = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [StatsGlobalComponent],
      providers: [
        { provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
        { provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
        { provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    fixture = TestBed.createComponent(StatsGlobalComponent);
    fixture.detectChanges(); // triggers ngOnInit which sets selectedMonthIndex to 2
    fixture.componentInstance.selectedMonthIndex.set(monthIndex);
    fixture.detectChanges();
  }

  it('devrait afficher le résumé de la semaine quand le mois courant est sélectionné', () => {
    setup(2);

    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.stats-card-title'));
    const weekSummaryTitle = titles.find(t => t.textContent?.trim() === 'Résumé de la semaine');

    expect(weekSummaryTitle).toBeTruthy();
  });

  it('devrait masquer le résumé de la semaine quand un mois passé est sélectionné', () => {
    setup(3);

    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.stats-card-title'));
    const weekSummaryTitle = titles.find(t => t.textContent?.trim() === 'Résumé de la semaine');

    expect(weekSummaryTitle).toBeUndefined();
  });
});

describe("StatsGlobalComponent — merge d'exercices", () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StatsGlobalComponent>>;
  let mergeUseCaseSpy: ReturnType<typeof makeMergeExercisesUseCaseSpy>;

  const twoExercises = signal([
    { name: 'Développé couché', maxWeightKg: 80, totalVolumeKg: 2560, occurrenceCount: 4 },
    { name: 'Squat', maxWeightKg: 100, totalVolumeKg: 3200, occurrenceCount: 3 },
  ]);

  beforeEach(() => {
    const { statsUseCaseSpy, selectMonthUseCaseSpy, mergeUseCaseSpy: mu, routerSpy } = makeProviders({ exerciseSummaries: twoExercises });
    mergeUseCaseSpy = mu;

    TestBed.configureTestingModule({
      imports: [StatsGlobalComponent],
      providers: [
        { provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
        { provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
        { provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    fixture = TestBed.createComponent(StatsGlobalComponent);
    fixture.detectChanges();
  });

  it('devrait afficher un bouton "Merge" dans la carte exercices', () => {
    const el: HTMLElement = fixture.nativeElement;
    const mergeBtn = el.querySelector('[data-testid="merge-btn"]');
    expect(mergeBtn).toBeTruthy();
  });

  it('devrait activer le mode merge quand on clique sur le bouton "Merge"', () => {
    const el: HTMLElement = fixture.nativeElement;
    const mergeBtn = el.querySelector<HTMLElement>('[data-testid="merge-btn"]')!;
    mergeBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isMergeMode()).toBeTrue();
  });

  it('devrait afficher des cases à cocher sur chaque exercice en mode merge', () => {
    fixture.componentInstance.isMergeMode.set(true);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const checkboxes = el.querySelectorAll('[data-testid="exercise-merge-checkbox"]');
    expect(checkboxes.length).toBe(2);
  });

  it('devrait afficher la popup de confirmation quand on soumet le merge', () => {
    fixture.componentInstance.isMergeMode.set(true);
    fixture.componentInstance.mergeSelectedNames.set(new Set(['Développé couché', 'Squat']));
    fixture.componentInstance.mergeNewName.set('Compound');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const submitBtn = el.querySelector<HTMLElement>('[data-testid="merge-submit-btn"]')!;
    submitBtn.click();
    fixture.detectChanges();

    const popup = el.querySelector('[data-testid="merge-confirm-popup"]');
    expect(popup).toBeTruthy();
  });

  it('devrait appeler MergeExercisesUseCase.execute avec les noms sélectionnés et le nouveau nom', async () => {
    fixture.componentInstance.isMergeMode.set(true);
    fixture.componentInstance.mergeSelectedNames.set(new Set(['Développé couché', 'Squat']));
    fixture.componentInstance.mergeNewName.set('Compound');
    fixture.componentInstance.showMergeConfirm.set(true);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const confirmBtn = el.querySelector<HTMLElement>('[data-testid="merge-confirm-ok-btn"]')!;
    confirmBtn.click();
    fixture.detectChanges();

    await fixture.whenStable();

    expect(mergeUseCaseSpy.execute).toHaveBeenCalledWith(
      jasmine.arrayContaining(['Développé couché', 'Squat']),
      'Compound'
    );
  });
});
