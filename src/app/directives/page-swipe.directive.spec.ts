import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageSwipeDirective } from './page-swipe.directive';
@Component({
  imports: [PageSwipeDirective],
  template:
    '<div pageSwipe [swipeDisabled]="busy" (swipePage)="pages.push($event)"><a href="/game">Game</a><button>Serials</button></div>',
})
class Host {
  busy = false;
  pages: number[] = [];
}
describe('Page swipes', () => {
  it('allows a fresh card tap immediately after repeated swipes, even without trailing clicks', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(Host);
    try {
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a');
      const opened = vi.fn();
      // Observe whether the capture handler lets the click reach the card.
      link.addEventListener('click', (event: Event) => { opened(); event.preventDefault(); });
      const touch = (type: string, x: number) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.assign(event, {
          touches: type === 'touchend' ? [] : [{ clientX: x, clientY: 100 }],
          changedTouches: [{ clientX: x, clientY: 100 }],
        });
        link.dispatchEvent(event);
      };
      for (let i = 0; i < 6; i++) {
        touch('touchstart', 250);
        touch('touchmove', 100);
        touch('touchend', 80);
        if (i % 2 === 0) {
          link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
      }
      expect(opened).not.toHaveBeenCalled();
      expect(fixture.componentInstance.pages).toEqual([1, 1, 1, 1, 1, 1]);
      touch('touchstart', 150);
      touch('touchend', 150);
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(opened).toHaveBeenCalledTimes(1);
    } finally {
      fixture.destroy();
      vi.useRealTimers();
    }
  });

  it('navigates both ways, leaves vertical scrolling and controls alone, and suppresses the trailing card click', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('div');
    const link = grid.querySelector('a');
    function touch(type: string, x: number, y: number, target = link) {
      const e = new Event(type, { bubbles: true, cancelable: true });
      Object.assign(e, {
        touches: type === 'touchend' ? [] : [{ clientX: x, clientY: y }],
        changedTouches: [{ clientX: x, clientY: y }],
      });
      target.dispatchEvent(e);
      return e;
    }
    touch('touchstart', 250, 200);
    touch('touchmove', 140, 205);
    touch('touchend', 80, 210);
    expect(fixture.componentInstance.pages).toEqual([1]);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    touch('touchstart', 80, 200);
    touch('touchend', 260, 200);
    expect(fixture.componentInstance.pages).toEqual([1, -1]);
    touch('touchstart', 80, 200);
    expect(touch('touchmove', 90, 280).defaultPrevented).toBe(false);
    touch('touchend', 260, 280);
    expect(fixture.componentInstance.pages).toHaveLength(2);
    touch('touchstart', 80, 200, grid.querySelector('button'));
    touch('touchend', 260, 200);
    expect(fixture.componentInstance.pages).toHaveLength(2);
    fixture.componentInstance.busy = true;
    fixture.detectChanges();
    touch('touchstart', 250, 200);
    touch('touchend', 80, 200);
    expect(fixture.componentInstance.pages).toHaveLength(2);
    fixture.destroy();
  });
});
