import { Injectable } from "@angular/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

@Injectable({ providedIn: "root" })
export class HapticService {
	vibrate(pattern: number | number[] = 30): void {
		Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
			if ("vibrate" in navigator) navigator.vibrate(pattern);
		});
	}
}
