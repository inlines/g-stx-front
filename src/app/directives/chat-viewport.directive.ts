import { DestroyRef, Directive, ElementRef, inject, NgZone, OnInit } from '@angular/core';

/** Mobile keyboards resize the visual viewport, not necessarily CSS vh/dvh. */
@Directive({ selector: '[chatViewport]' })
export class ChatViewportDirective implements OnInit {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  ngOnInit(): void {
    const viewport = window.visualViewport;
    if (!viewport) return; // The stylesheet retains the vh/dvh fallback.
    const update = () => {
      // Let the browser magnify content normally during pinch zoom.
      if (viewport.scale !== 1) return;
      this.element.style.setProperty('--chat-height', `${viewport.height}px`);
      this.element.style.setProperty('--chat-top', `${viewport.offsetTop}px`);
    };
    this.zone.runOutsideAngular(() => {
      update();
      viewport.addEventListener('resize', update);
      viewport.addEventListener('scroll', update);
    });
    this.destroyRef.onDestroy(() => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    });
  }
}
