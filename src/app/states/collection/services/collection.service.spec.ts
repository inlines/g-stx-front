import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { ICollectionItem } from '../interfaces/collection-item.interface';
import { CollectionService } from './collection.service';
const item = (id: number) => ({ release_id: id }) as ICollectionItem;
describe('Complete personal list loading', () => {
  let service: CollectionService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: TEST_PROVIDERS });
    service = TestBed.inject(CollectionService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  it('follows total_count and combines pages before delivering the list', () => {
    const next = vi.fn();
    service.getCompleteCollection({ cat: 48 }).subscribe(next);
    const first = http.expectOne((r) => r.url === '/api/collection');
    expect(first.request.params.get('limit')).toBe('1000');
    first.flush({ items: [item(1), item(2)], total_count: 3 });
    expect(next).not.toHaveBeenCalled();
    const second = http.expectOne((r) => r.url === '/api/collection');
    expect(second.request.params.get('offset')).toBe('2');
    second.flush({ items: [item(3)], total_count: 3 });
    expect(next).toHaveBeenCalledExactlyOnceWith({ items: [item(1), item(2), item(3)], total_count: 3 });
  });
  it('cancels an in-flight continuation when unsubscribed', () => {
    const sub = service.getCompleteWishlist({ cat: 48 }).subscribe();
    http.expectOne((r) => r.url === '/api/wishlist').flush({ items: [item(1)], total_count: 2 });
    const req = http.expectOne((r) => r.url === '/api/wishlist');
    sub.unsubscribe();
    expect(req.cancelled).toBe(true);
  });
  it('reports incomplete responses instead of looping on an empty page', () => {
    const error = vi.fn();
    service.getCompleteCollection({ cat: 48 }).subscribe({ error });
    http.expectOne((r) => r.url === '/api/collection').flush({ items: [], total_count: 3 });
    expect(error).toHaveBeenCalledOnce();
  });
});
