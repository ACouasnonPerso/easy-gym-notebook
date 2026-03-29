import { Component, ChangeDetectionStrategy, output, inject, signal } from '@angular/core';
import { MassUnitService, MassUnit } from '../../core_logic/mass-unit/mass-unit.service';

const MASS_UNIT_LABELS: Record<MassUnit, string> = {
  metric: 'Métrique',
  imperial: 'Britanique',
  us: 'US',
};

@Component({
  selector: 'app-mass-unit-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mass-unit-select-container">
      <div class="mass-unit-select-wrapper" (click)="showDropdown.set(!showDropdown())">
        <span class="mass-unit-label">{{ label() }}</span>
        <span class="mass-unit-arrow" [class.open]="showDropdown()">▼</span>
      </div>
      @if (showDropdown()) {
        <div class="mass-unit-dropdown-backdrop" (click)="showDropdown.set(false)"></div>
        <div class="mass-unit-dropdown-list">
          @for (unit of units; track unit) {
            <div
              class="mass-unit-dropdown-item"
              [class.selected]="unit === massUnitService.activeMassUnit()"
              (click)="select(unit)"
            >{{ unitLabel(unit) }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .mass-unit-select-container { position: relative; }
    .mass-unit-select-wrapper {
      display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;
    }
    .mass-unit-label {
      font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: var(--text);
    }
    .mass-unit-arrow {
      font-size: 9px; color: var(--orange); transition: transform 0.2s;
      &.open { transform: rotate(180deg); }
    }
    .mass-unit-dropdown-backdrop { position: fixed; inset: 0; z-index: 99; }
    .mass-unit-dropdown-list {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 100;
      background: var(--card2); border: 1px solid var(--border); border-radius: 14px;
      padding: 6px; display: flex; flex-direction: column; gap: 2px; min-width: 100px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .mass-unit-dropdown-item {
      font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700;
      color: var(--sub); padding: 9px 14px; border-radius: 9px; cursor: pointer;
      transition: background 0.12s, color 0.12s;
      &:hover { background: var(--card); color: var(--text); }
      &.selected { color: var(--orange); background: var(--orange-dim); }
    }
  `],
})
export class MassUnitSelectorComponent {
  readonly massUnitChange = output<MassUnit>();

  readonly massUnitService = inject(MassUnitService);
  readonly showDropdown = signal(false);

  readonly units: MassUnit[] = ['metric', 'imperial', 'us'];

  readonly label = () => MASS_UNIT_LABELS[this.massUnitService.activeMassUnit()];

  unitLabel(unit: MassUnit): string {
    return MASS_UNIT_LABELS[unit];
  }

  select(unit: MassUnit): void {
    this.massUnitChange.emit(unit);
    this.showDropdown.set(false);
  }
}
