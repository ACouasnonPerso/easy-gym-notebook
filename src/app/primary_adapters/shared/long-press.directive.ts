import { Directive, ElementRef, OnInit, OnDestroy, output, inject } from "@angular/core";
import { fromEvent, merge, Subscription, timer } from "rxjs";
import { switchMap, takeUntil } from "rxjs/operators";

@Directive({
	selector: "[appLongPress]",
	standalone: true,
})
export class LongPressDirective implements OnInit, OnDestroy {
	readonly longPress = output<void>();

	private readonly el = inject(ElementRef);
	private subscription = new Subscription();

	ngOnInit(): void {
		const el = this.el.nativeElement as HTMLElement;
		const cancel$ = merge(fromEvent(el, "pointerup"), fromEvent(el, "pointercancel"), fromEvent(el, "pointermove"));

		this.subscription = fromEvent<PointerEvent>(el, "pointerdown")
			.pipe(switchMap(() => timer(700).pipe(takeUntil(cancel$))))
			.subscribe(() => this.longPress.emit());
	}

	ngOnDestroy(): void {
		this.subscription.unsubscribe();
	}
}
