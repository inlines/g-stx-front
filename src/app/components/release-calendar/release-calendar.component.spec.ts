import { ListScrollService } from '@app/shared/list-scroll.service';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { ReleaseCalendarComponent } from './release-calendar.component';
describe('calendar interactions', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it('opens a long-pressed stack without navigating, and cancels on scrolling', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    TestBed.configureTestingModule({ imports: [ReleaseCalendarComponent], providers: TEST_PROVIDERS });
    const f = TestBed.createComponent(ReleaseCalendarComponent);
    f.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/release-calendar')
      .flush({
        start: '2026-09-01',
        items: [
          { id: 1, name: 'One', platform: 48, day: '2026-09-01', image_url: null },
          { id: 2, name: 'Two', platform: 167, day: '2026-09-01', image_url: null },
        ],
      });
    f.detectChanges();
    const c = f.componentInstance;
    const day = c.days.find((d) => d?.games.length === 2)!;
    const el = f.nativeElement.querySelector('article');
    const nav = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    c.press({ pointerType: 'touch', clientX: 0, clientY: 0 } as PointerEvent, day, el);
    vi.advanceTimersByTime(500);
    expect(c.open?.games.length).toBe(2);
    const click = new MouseEvent('click', { cancelable: true });
    c.go(click, day.games[0]);
    expect(click.defaultPrevented).toBe(true);
    expect(nav).not.toHaveBeenCalled();
    c.close();
    c.press({ pointerType: 'touch', clientX: 0, clientY: 0 } as PointerEvent, day, el);
    c.move({ clientX: 25, clientY: 0 } as PointerEvent);
    vi.advanceTimersByTime(500);
    expect(c.open).toBeNull();
    c.go(new MouseEvent('click', { cancelable: true }), day.games[0]);
    expect(nav).toHaveBeenCalledWith('/products/1;platform=48');
    f.destroy();
    TestBed.inject(HttpTestingController).verify();
  });
  it('restores month and platform before restoring the loaded calendar scroll', () => {
    const restore = vi.fn().mockReturnValue(true);
    TestBed.configureTestingModule({
      imports: [ReleaseCalendarComponent],
      providers: [...TEST_PROVIDERS, { provide: ListScrollService, useValue: { attach: () => restore } }],
    });
    const http = TestBed.inject(HttpTestingController);
    const first = TestBed.createComponent(ReleaseCalendarComponent);
    http.expectOne('/api/release-calendar').flush({ start: '2026-09-01', items: [] });
    first.componentInstance.chooseMonth(1);
    first.componentInstance.choosePlatform(167);
    first.destroy();
    restore.mockClear();
    const back = TestBed.createComponent(ReleaseCalendarComponent);
    expect(restore).not.toHaveBeenCalled();
    http.expectOne('/api/release-calendar').flush({ start: '2026-09-01', items: [] });
    expect(back.componentInstance.month).toBe(1);
    expect(back.componentInstance.platform).toBe(167);
    expect(restore).toHaveBeenCalledOnce();
    back.componentInstance.stepMonth(1);
    back.componentInstance.stepMonth(1);
    expect(back.componentInstance.month).toBe(2);
    back.componentInstance.stepMonth(-1);
    expect(back.componentInstance.month).toBe(1);
    back.destroy();
    http.verify();
  });
});
