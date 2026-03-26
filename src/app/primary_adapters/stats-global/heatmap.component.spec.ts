import { TestBed } from '@angular/core/testing';
import { HeatmapComponent, HeatmapCell } from './heatmap.component';

function makeToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

describe('HeatmapComponent — jour actuel', () => {
  let component: HeatmapComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HeatmapComponent],
    });
    const fixture = TestBed.createComponent(HeatmapComponent);
    component = fixture.componentInstance;
  });

  it("devrait retourner une classe contenant 'today' pour le jour actuel sans séance", () => {
    const cell: HeatmapCell = {
      date: makeToday(),
      hasSession: false,
      isCurrentMonth: true,
    };

    const cssClass = component.getCellClass(cell);

    expect(cssClass).toContain('today');
  });

  it("devrait retourner 'hm-cell done today' pour le jour actuel avec une séance", () => {
    const cell: HeatmapCell = {
      date: makeToday(),
      hasSession: true,
      isCurrentMonth: true,
    };

    const cssClass = component.getCellClass(cell);

    expect(cssClass).toBe('hm-cell done today');
  });

  it("devrait retourner 'hm-cell empty' pour un jour passé sans séance (pas aujourd'hui)", () => {
    const yesterday = makeToday();
    yesterday.setDate(yesterday.getDate() - 1);
    const cell: HeatmapCell = {
      date: yesterday,
      hasSession: false,
      isCurrentMonth: true,
    };

    const cssClass = component.getCellClass(cell);

    expect(cssClass).toBe('hm-cell empty');
  });
});
