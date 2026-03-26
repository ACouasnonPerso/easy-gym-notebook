import { Directive, ElementRef, OnInit, OnDestroy, output, inject } from '@angular/core';

@Directive({
  selector: '[appScrollSentinel]',
  standalone: true,
})
export class ScrollSentinelDirective implements OnInit, OnDestroy {
  readonly visible = output<void>();

  private readonly el = inject(ElementRef);
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) this.visible.emit();
      },
      { threshold: 0 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
