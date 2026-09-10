import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideRouter } from '@angular/router';
import { OnboardingComponent } from './onboarding.component';

describe('Safe interactive tutorial', () => {
  const close = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    close.mockClear();
    TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [provideRouter([]), { provide: NgbActiveModal, useValue: { close } }],
    });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it('walks through all eight features, cleans up timers and finishes explicitly', () => {
    const fixture = TestBed.createComponent(OnboardingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.steps.map((s) => s.name)).toEqual([
      'Каталог',
      'Коллекция',
      'Заявки',
      'Вишлист',
      'Продажа',
      'Игроки',
      'Чат',
      'Kudos',
    ]);
    vi.advanceTimersByTime(2100);
    expect(component.phase()).toBe(2);
    for (let i = 1; i < 8; i++) {
      component.next();
      fixture.detectChanges();
      expect(component.index()).toBe(i);
    }
    component.demonstrate();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.kudos-score').textContent).toContain('360');
    expect(fixture.nativeElement.textContent).toContain('+5');
    expect(close).not.toHaveBeenCalled();
    component.next();
    expect(close).toHaveBeenCalledOnce();
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps real game links inert and allows both request demonstrations', () => {
    const fixture = TestBed.createComponent(OnboardingComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.game-preview').hasAttribute('inert')).toBe(true);
    const component = fixture.componentInstance;
    component.select(2);
    component.chooseRequest('name');
    component.demonstrate();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ночная трасса');
    expect(fixture.nativeElement.textContent).toContain('+5');
    component.chooseRequest('serial');
    component.demonstrate();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('CUSA-01234');
    component.select(-1);
    expect(component.index()).toBe(2);
  });
  it('honours reduced motion without hiding the action result', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const fixture = TestBed.createComponent(OnboardingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.phase()).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
