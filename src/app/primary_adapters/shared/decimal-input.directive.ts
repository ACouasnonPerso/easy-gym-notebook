import { Directive, ElementRef, inject, OnInit, OnDestroy } from "@angular/core";
import { fromEvent, Subscription } from "rxjs";

@Directive({
	selector: "[appDecimalInput]",
	standalone: true,
})
export class DecimalInputDirective implements OnInit, OnDestroy {
	private readonly el = inject(ElementRef);
	private subscription = new Subscription();

	ngOnInit(): void {
		const input = this.el.nativeElement as HTMLInputElement;

		this.subscription = fromEvent(input, "input").subscribe(() => {
			const cursor = input.selectionStart ?? input.value.length;
			const sanitized = this.sanitize(input.value);
			if (sanitized !== input.value) {
				input.value = sanitized;
				input.setSelectionRange(Math.min(cursor, sanitized.length), Math.min(cursor, sanitized.length));
			}
		});
	}

	ngOnDestroy(): void {
		this.subscription.unsubscribe();
	}

	private sanitize(raw: string): string {
		let result = raw.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
		// Allow minus only at position 0
		const leading = result.startsWith("-") ? "-" : "";
		result = leading + result.replace(/-/g, "");
		// Keep only the first dot
		const firstDot = result.indexOf(".");
		if (firstDot !== -1) {
			result = result.slice(0, firstDot + 1) + result.slice(firstDot + 1).replace(/\./g, "");
		}
		return result;
	}
}
