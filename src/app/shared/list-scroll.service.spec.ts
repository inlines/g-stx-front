import { Component, DestroyRef, inject, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ListScrollService } from './list-scroll.service';

@Component({ template: '<div>Loaded list</div>' })
class ListHost {
  readonly ready = inject(ListScrollService).attach(inject(DestroyRef), inject(Injector));
}

describe('List return scroll', () => {
  let events: Subject<unknown>;
  beforeEach(() => {
    events = new Subject();
    TestBed.configureTestingModule({ imports: [ListHost], providers: [
      { provide: Router, useValue: { events, getCurrentNavigation: () => ({ id: 1 }) } },
    ] });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('waits for data and render, restores once, and supports repeated back navigation', () => {
    const first = TestBed.createComponent(ListHost); first.detectChanges();
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1450);
    events.next(new NavigationStart(2, '/products/42'));
    first.destroy(); events.next(new NavigationEnd(2, '/products/42', '/products/42'));
    events.next(new NavigationStart(3, '/collection', 'popstate', { navigationId: 1 }));
    const returned = TestBed.createComponent(ListHost); returned.detectChanges();
    events.next(new NavigationEnd(3, '/collection', '/collection'));
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(returned.componentInstance.ready()).toBe(true);
    returned.detectChanges();
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 1450, behavior: 'instant' });
    expect(returned.componentInstance.ready()).toBe(false);
    events.next(new NavigationStart(4, '/products/43')); returned.destroy();
    events.next(new NavigationEnd(4, '/products/43', '/products/43'));
    events.next(new NavigationStart(5, '/collection', 'popstate', { navigationId: 3 }));
    const again = TestBed.createComponent(ListHost);
    expect(again.componentInstance.ready()).toBe(true); again.detectChanges(); again.destroy();
  });

  it('cancels queued list restoration as soon as a game navigation starts', () => {
    const first = TestBed.createComponent(ListHost); first.detectChanges();
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1800);
    events.next(new NavigationStart(2, '/products/42')); first.destroy();
    events.next(new NavigationEnd(2, '/products/42', '/products/42'));
    events.next(new NavigationStart(3, '/collection', 'popstate', { navigationId: 1 }));
    const returned = TestBed.createComponent(ListHost);
    expect(returned.componentInstance.ready()).toBe(true);
    // A resolver can leave the list alive while navigation is already underway.
    events.next(new NavigationStart(4, '/products/43'));
    returned.detectChanges();
    expect(window.scrollTo).not.toHaveBeenCalled();
    returned.destroy();
  });

  it('does not restore an old position when opening a list through the menu', () => {
    const first = TestBed.createComponent(ListHost);
    events.next(new NavigationStart(2, '/products/42')); first.destroy();
    events.next(new NavigationEnd(2, '/products/42', '/products/42'));
    events.next(new NavigationStart(3, '/collection'));
    const fresh = TestBed.createComponent(ListHost);
    expect(fresh.componentInstance.ready()).toBe(false); fresh.detectChanges();
    expect(window.scrollTo).not.toHaveBeenCalled(); fresh.destroy();
  });
});
