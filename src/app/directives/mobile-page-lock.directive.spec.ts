import { MobilePageLockDirective } from './mobile-page-lock.directive';

describe('MobilePageLockDirective', () => {
  let directive: MobilePageLockDirective;
  let media: {matches:boolean; addEventListener:ReturnType<typeof vi.fn>; removeEventListener:ReturnType<typeof vi.fn>};
  beforeEach(() => {
    media = {matches:true, addEventListener:vi.fn(), removeEventListener:vi.fn()};
    vi.stubGlobal('matchMedia', vi.fn(() => media));
    vi.stubGlobal('scrollTo', vi.fn());
    vi.stubGlobal('scrollY', 320);
    directive = new MobilePageLockDirective();
    directive.ngOnInit();
  });
  afterEach(() => { directive.ngOnDestroy(); vi.unstubAllGlobals(); });
  it('locks once across overlapping photo/chat states and restores the background position', () => {
    directive.mobilePageLock = true;
    directive.ngOnChanges();
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-320px');
    directive.ngOnChanges();
    expect(window.scrollTo).not.toHaveBeenCalled();
    directive.mobilePageLock = false;
    directive.ngOnChanges();
    expect(document.body.style.position).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith({left:0, top:320, behavior:'instant'});
  });
  it('releases when switching to desktop and removes its listener on destruction', () => {
    directive.mobilePageLock = true;
    directive.ngOnChanges();
    media.matches = false;
    media.addEventListener.mock.calls[0][1]();
    expect(document.body.style.position).toBe('');
    directive.ngOnDestroy();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', media.addEventListener.mock.calls[0][1]);
  });
});
