import { DestroyRef, Directive, ElementRef, EventEmitter, inject, Input, Output } from '@angular/core';

@Directive({ selector: '[pageSwipe]' })
export class PageSwipeDirective {
  @Input() swipeDisabled = false;
  @Output() swipePage = new EventEmitter<number>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private start: { x: number; y: number; time: number } | null = null;
  private suppressClickUntil = 0;

  constructor() {
    const begin = (event: TouchEvent) => {
      this.start = null;
      if (this.swipeDisabled || event.touches.length !== 1) return;
      let target = event.target as HTMLElement | null;
      if (target?.closest('button,input,select,textarea,summary,[contenteditable]')) return;
      // Nested horizontal scrollers (serial lists/carousels) own their gestures.
      while (target && target !== this.host) {
        const style = getComputedStyle(target);
        if (/(auto|scroll)/.test(style.overflowX) && target.scrollWidth > target.clientWidth) return;
        target = target.parentElement;
      }
      const touch = event.touches[0];
      this.start = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };
    const move = (event: TouchEvent) => {
      if (!this.start || event.touches.length !== 1) {
        this.start = null;
        return;
      }
      const dx = Math.abs(event.touches[0].clientX - this.start.x);
      const dy = Math.abs(event.touches[0].clientY - this.start.y);
      if (dy > 12 && dy * 1.7 > dx) {
        this.start = null;
        return;
      }
      if (dx > 12 && dx > dy * 1.7 && event.cancelable) event.preventDefault();
    };
    const end = (event: TouchEvent) => {
      const start = this.start;
      this.start = null;
      if (!start || this.swipeDisabled || event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x,
        dy = touch.clientY - start.y;
      if (Date.now() - start.time > 1000 || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.7) return;
      this.suppressClickUntil = Date.now() + 500;
      this.swipePage.emit(dx < 0 ? 1 : -1);
    };
    const cancel = () => {
      this.start = null;
    };
    const click = (event: MouseEvent) => {
      if (Date.now() < this.suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    this.host.addEventListener('touchstart', begin, { passive: true });
    this.host.addEventListener('touchmove', move, { passive: false });
    this.host.addEventListener('touchend', end, { passive: true });
    this.host.addEventListener('touchcancel', cancel, { passive: true });
    this.host.addEventListener('click', click, true);
    inject(DestroyRef).onDestroy(() => {
      this.host.removeEventListener('touchstart', begin);
      this.host.removeEventListener('touchmove', move);
      this.host.removeEventListener('touchend', end);
      this.host.removeEventListener('touchcancel', cancel);
      this.host.removeEventListener('click', click, true);
    });
  }
}
