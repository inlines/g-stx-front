import { Directive, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';

/** Keep fixed mobile panels stationary while their own contents remain scrollable. */
@Directive({ selector: '[mobilePageLock]' })
export class MobilePageLockDirective implements OnInit, OnChanges, OnDestroy {
  @Input() mobilePageLock = false;
  private media?: MediaQueryList;
  private restore?: () => void;

  ngOnInit(): void {
    this.media = window.matchMedia('(max-width: 767px)');
    this.media.addEventListener('change', this.update);
    this.update();
  }

  ngOnChanges(): void { this.update(); }

  ngOnDestroy(): void {
    this.media?.removeEventListener('change', this.update);
    this.unlock();
  }

  private update = (): void => {
    if (!this.mobilePageLock || !this.media?.matches) {
      this.unlock();
      return;
    }
    if (this.restore) return;
    const body = document.body.style;
    const html = document.documentElement.style;
    const x = window.scrollX, y = window.scrollY;
    const properties = ['position', 'top', 'left', 'right', 'width', 'overflow'];
    const saved = properties.map(name => [name, body.getPropertyValue(name), body.getPropertyPriority(name)]);
    const overflow = html.overflow;
    const overscroll = html.overscrollBehavior;
    body.position = 'fixed';
    body.top = `${-y}px`;
    body.left = `${-x}px`;
    body.right = '0';
    body.width = '100%';
    body.overflow = 'hidden';
    html.overflow = 'hidden';
    html.overscrollBehavior = 'none';
    this.restore = () => {
      saved.forEach(([name, value, priority]) => value ? body.setProperty(name, value, priority) : body.removeProperty(name));
      html.overflow = overflow;
      html.overscrollBehavior = overscroll;
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
    };
  };

  private unlock(): void {
    this.restore?.();
    this.restore = undefined;
  }
}
