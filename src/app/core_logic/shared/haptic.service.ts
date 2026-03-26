import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HapticService {
  vibrate(pattern: number | number[] = 30): void {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }
}
