import { TestBed } from '@angular/core/testing';
import { TrainingTimeBarChartComponent } from './training-time-bar-chart.component';

function makeEntry(date: Date, durationSeconds: number) {
  return { date, durationSeconds };
}

describe('TrainingTimeBarChartComponent — format de durée', () => {
  let component: TrainingTimeBarChartComponent;

  beforeEach(() => {
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);
    component = fixture.componentInstance;
  });

  it('devrait afficher "1h30" pour 5400 secondes', () => {
    expect(component.formatDuration(5400)).toBe('1h30');
  });

  it('devrait afficher "45min" pour 2700 secondes', () => {
    expect(component.formatDuration(2700)).toBe('45min');
  });

  it('devrait afficher "1h" pour 3600 secondes', () => {
    expect(component.formatDuration(3600)).toBe('1h');
  });
});

describe('TrainingTimeBarChartComponent — rendu des barres', () => {
  it("devrait ne pas rendre de barre pour les entrées avec durationSeconds === 0", () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 2, 5), 3600),
      makeEntry(new Date(2026, 2, 10), 0),
      makeEntry(new Date(2026, 2, 15), 1800),
    ]);
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]');
    expect(bars.length).toBe(2);
  });

  it('devrait calculer la hauteur relative correcte (la barre max atteint 100%)', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 2, 5), 3600),
      makeEntry(new Date(2026, 2, 10), 1800),
    ]);
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
    expect(bars[0].style.height).toBe('100%');
    expect(bars[1].style.height).toBe('50%');
  });

  it('devrait rendre N barres pour N entrées avec durée > 0', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 2, 5), 3600),
      makeEntry(new Date(2026, 2, 10), 2700),
      makeEntry(new Date(2026, 2, 15), 1800),
    ]);
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]');
    expect(bars.length).toBe(3);
  });
});

describe('TrainingTimeBarChartComponent — regroupement par période', () => {
  it('mode "day": deux sessions le même jour sont cumulées en une seule barre', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 2, 10, 9, 0), 1800),
      makeEntry(new Date(2026, 2, 10, 17, 0), 3600),
    ]);
    fixture.componentRef.setInput('mode', 'day');
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
    expect(bars.length).toBe(1);
    expect(bars[0].style.height).toBe('100%');
  });

  it('mode "day": deux sessions sur des jours différents restent deux barres séparées', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 2, 10), 1800),
      makeEntry(new Date(2026, 2, 11), 3600),
    ]);
    fixture.componentRef.setInput('mode', 'day');
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
    expect(bars.length).toBe(2);
  });

  it('mode "week": deux sessions la même semaine sont cumulées en une seule barre', () => {
    // lundi 9 mars 2026 et mercredi 11 mars 2026 — même semaine ISO
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 2, 9), 1800),   // lundi
      makeEntry(new Date(2026, 2, 11), 3600),  // mercredi
    ]);
    fixture.componentRef.setInput('mode', 'week');
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
    expect(bars.length).toBe(1);
    // durée cumulée = 5400s — barre unique à 100%
    expect(bars[0].style.height).toBe('100%');
  });

  it('mode "week": deux sessions sur des semaines différentes restent deux barres séparées', () => {
    // lundi 9 mars 2026 (sem 11) et lundi 16 mars 2026 (sem 12)
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 2, 9), 1800),   // semaine 11
      makeEntry(new Date(2026, 2, 16), 3600),  // semaine 12
    ]);
    fixture.componentRef.setInput('mode', 'week');
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
    expect(bars.length).toBe(2);
  });

  it('mode "month": deux sessions le même mois sont cumulées en une seule barre', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 2, 5), 1800),
      makeEntry(new Date(2026, 2, 20), 3600),
    ]);
    fixture.componentRef.setInput('mode', 'month');
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
    expect(bars.length).toBe(1);
    expect(bars[0].style.height).toBe('100%');
  });

  it('mode "month": deux sessions sur des mois différents restent deux barres séparées', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [TrainingTimeBarChartComponent],
    }).createComponent(TrainingTimeBarChartComponent);

    fixture.componentRef.setInput('sessions', [
      makeEntry(new Date(2026, 1, 15), 1800),  // février
      makeEntry(new Date(2026, 2, 15), 3600),  // mars
    ]);
    fixture.componentRef.setInput('mode', 'month');
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('[data-testid="bar"]') as NodeListOf<HTMLElement>;
    expect(bars.length).toBe(2);
  });
});
