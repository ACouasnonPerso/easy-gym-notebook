import { TestBed } from '@angular/core/testing';
import { ChartSelectionService } from './chart-selection.service';

describe('ChartSelectionService', () => {
  function setup() {
    localStorage.clear();
    TestBed.configureTestingModule({});
    return TestBed.inject(ChartSelectionService);
  }

  it('should return "volume" as the default selected chart', () => {
    const service = setup();
    expect(service.selectedChart()).toBe('volume');
  });

  it('should persist the selected chart in localStorage when selecting "weight"', () => {
    const service = setup();
    service.select('weight');
    expect(localStorage.getItem('chart-selection')).toBe('weight');
  });

  it('should restore "weight" from localStorage on a new instance', () => {
    localStorage.setItem('chart-selection', 'weight');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ChartSelectionService);
    expect(service.selectedChart()).toBe('weight');
  });
});
