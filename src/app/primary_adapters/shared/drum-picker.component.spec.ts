import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DrumPickerComponent } from './drum-picker.component';

const ITEM_HEIGHT = 40;
const PHANTOM_COUNT = 2;

@Component({
  standalone: true,
  imports: [DrumPickerComponent],
  template: `
    <app-drum-picker
      [values]="values"
      [selectedValue]="selectedValue()"
    />
  `,
})
class HostComponent {
  values = [10, 20, 30, 40, 50];
  selectedValue = signal<number | string>(10);
}

describe('DrumPickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function getScrollContainer(): HTMLElement {
    return fixture.nativeElement.querySelector('.drum-scroll');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should scroll to the initially selected value on init', () => {
    // values[0] = 10, so index 0, scrollTop = 0 * 40 = 0
    expect(getScrollContainer().scrollTop).toBe(0);
  });

  it('should scroll to reposition the drum when the selected value changes after init', async () => {
    // Change selected value to 30 (index 2), expected scrollTop = 2 * 40 = 80
    host.selectedValue.set(30);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getScrollContainer().scrollTop).toBe(80);
  });
});
