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
