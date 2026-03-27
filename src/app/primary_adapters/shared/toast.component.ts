import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

export type ToastType = 'success' | 'error';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent implements OnChanges {
  readonly message = input<string>('');
  readonly type = input<ToastType>('success');
  readonly visible = input<boolean>(false);
  readonly dismissed = output<void>();

  private _timer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      if (this._timer) clearTimeout(this._timer);
      this._timer = setTimeout(() => this.dismissed.emit(), 3000);
    }
  }
}
