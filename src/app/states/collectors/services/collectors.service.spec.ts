import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { CollectorsService } from './collectors.service';
describe('Public collection loading', () => {
  let service: CollectorsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: TEST_PROVIDERS });
    service = TestBed.inject(CollectorsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  it('loads beyond the old 100-release default using the existing API', () => {
    const next = vi.fn();
    service.getCollectorProperties('alice').subscribe(next);
    const first = http.expectOne((r) => r.url === '/api/collection-by-login/alice');
    expect(first.request.params.get('limit')).toBe('1000');
    expect(first.request.params.get('offset')).toBe('0');
    const batch = Array.from({ length: 1000 }, (_, i) => ({ release_id: i }));
    first.flush(batch);
    expect(next).not.toHaveBeenCalled();
    const second = http.expectOne((r) => r.url === '/api/collection-by-login/alice');
    expect(second.request.params.get('offset')).toBe('1000');
    second.flush([{ release_id: 1000 }]);
    expect(next).toHaveBeenCalledExactlyOnceWith([...batch, { release_id: 1000 }]);
  });
  it('cancels unfinished loading on unsubscribe', () => {
    const sub = service.getCollectorProperties('alice').subscribe();
    const req = http.expectOne((r) => r.url === '/api/collection-by-login/alice');
    sub.unsubscribe();
    expect(req.cancelled).toBe(true);
  });
});
