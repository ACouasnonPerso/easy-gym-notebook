import { Injectable, signal } from '@angular/core';

export type ChartType = 'volume' | 'weight';

const STORAGE_KEY = 'chart-selection';

@Injectable({ providedIn: 'root' })
export class ChartSelectionService {
  private readonly _selectedChart = signal<ChartType>(this.loadFromStorage());
  readonly selectedChart = this._selectedChart.asReadonly();

  select(chart: ChartType): void {
    this._selectedChart.set(chart);
    localStorage.setItem(STORAGE_KEY, chart);
  }

  private loadFromStorage(): ChartType {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'weight' ? 'weight' : 'volume';
  }
}
