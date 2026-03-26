import { Component, ChangeDetectionStrategy, input, output, viewChild, ElementRef, effect, afterNextRender } from '@angular/core';

const ITEM_HEIGHT = 40;
const PHANTOM_COUNT = 1;

@Component({
  selector: 'app-drum-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="drum-wrapper">
      <div
        #scrollContainer
        class="drum-scroll"
        (scroll)="onScroll($event)"
      >
        @for (_ of phantoms; track $index) {
          <div class="drum-item phantom"></div>
        }
        @for (value of values(); track value) {
          <div
            class="drum-item"
            [class.active]="value === selectedValue()"
          >{{ value }}{{ unit() ? ' ' + unit() : '' }}</div>
        }
        @for (_ of phantoms; track $index) {
          <div class="drum-item phantom"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .drum-wrapper {
      position: relative;
      height: 120px;
      overflow: hidden;
    }
    .drum-scroll {
      height: 120px;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .drum-scroll::-webkit-scrollbar {
      display: none;
    }
    .drum-item {
      height: 40px;
      scroll-snap-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 15px;
      opacity: 0.4;
      transition: transform 0.15s, opacity 0.15s;
    }
    .drum-item.phantom {
      visibility: hidden;
    }
    .drum-item.active {
      opacity: 1;
      font-weight: 700;
      transform: scale(1.2);
    }
  `],
})
export class DrumPickerComponent {
  readonly values = input.required<(number | string)[]>();
  readonly selectedValue = input.required<number | string>();
  readonly unit = input<string>('');
  readonly valueChange = output<number | string>();

  readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');

  readonly phantoms = Array(PHANTOM_COUNT).fill(null);

  private initialRenderDone = false;

  constructor() {
    afterNextRender(() => {
      this.scrollToSelected();
      this.initialRenderDone = true;
    });

    effect(() => {
      if (!this.initialRenderDone) return;
      this.scrollToSelected();
    });
  }

  private scrollToSelected(): void {
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;
    const index = this.values().indexOf(this.selectedValue());
    if (index >= 0)
      container.scrollTop = index * ITEM_HEIGHT;
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const activeIndex = Math.round(container.scrollTop / ITEM_HEIGHT);
    const newValue = this.values()[activeIndex];
    if (newValue !== undefined && newValue !== this.selectedValue())
      this.valueChange.emit(newValue);
  }
}
