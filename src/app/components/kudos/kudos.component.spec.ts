import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { KudosScore, KudosService } from '@app/services/kudos.service';
import { KudosComponent } from './kudos.component';
describe('Kudos badge', () => {
  it('shows zero without loading, and never shows the previous account score after switching', () => {
    const streams = new Map<string, Subject<KudosScore | null>>();
    const score = vi.fn((login: string) => {
      const stream = new Subject<KudosScore | null>();
      streams.set(login, stream);
      return stream;
    });
    TestBed.configureTestingModule({ imports: [KudosComponent], providers: TEST_PROVIDERS });
    TestBed.overrideProvider(KudosService, { useValue: { score } });
    const fixture = TestBed.createComponent(KudosComponent);
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('0 Kudos');
    expect(score).not.toHaveBeenCalled();
    fixture.componentRef.setInput('value', undefined);
    fixture.componentRef.setInput('login', 'first');
    fixture.detectChanges();
    streams.get('first')!.next({ user_login: 'first', kudos: 100 });
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('100 Kudos');
    fixture.componentRef.setInput('login', 'second');
    fixture.detectChanges();
    streams.get('first')!.next({ user_login: 'first', kudos: 200 });
    fixture.detectChanges();
    expect(fixture.componentInstance.amount).toBeNull();
    streams.get('second')!.next({ user_login: 'second', kudos: 10 });
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('10 Kudos');
    fixture.destroy();
  });
});
