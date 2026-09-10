import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { KudosService } from './kudos.service';
describe('Kudos score refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: TEST_PROVIDERS });
    TestBed.overrideProvider(KudosService, { useFactory: () => new KudosService() });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.useRealTimers();
  });
  it('shares one request and refresh timer, and stops polling without visible counters', async () => {
    const service = TestBed.inject(KudosService);
    const http = TestBed.inject(HttpTestingController);
    const first: Array<number | null> = [];
    const a = service.score('collector').subscribe((score) => first.push(score?.kudos ?? null));
    const b = service.score('collector').subscribe();
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('/api/kudos?login=collector').flush({ user_login: 'collector', kudos: 10 });
    await vi.advanceTimersByTimeAsync(60000);
    http.expectOne('/api/kudos?login=collector').flush({ user_login: 'collector', kudos: 20 });
    expect(first).toEqual([10, 20]);
    a.unsubscribe();
    b.unsubscribe();
    await vi.advanceTimersByTimeAsync(60000);
    http.expectNone((r) => r.url === '/api/kudos');
  });
});
