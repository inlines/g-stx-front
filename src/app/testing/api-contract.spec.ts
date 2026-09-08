import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RequestStatus } from '@app/constants/request-status.const';
import { ToastService } from '@app/services/toast.service';
import { AuthService } from '@app/states/auth/services/auth.service';
import { CollectionService } from '@app/states/collection/services/collection.service';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { ProductsService } from '@app/states/products/services/products.service';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { TEST_PROVIDERS } from './test-providers';

describe('Existing Rust API contract', () => {
  let http: HttpTestingController;
  let store: Store;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...TEST_PROVIDERS, { provide: ToastService, useValue: { show() {}, clear() {} } }],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('preserves catalog GET parameters and emits no speculative filters', () => {
    TestBed.inject(ProductsService)
      .productsRequest({
        cat: 6,
        limit: 15,
        offset: 30,
        query: ' mario ',
        sort: 'date',
        ignore_digital: true,
      })
      .subscribe();
    const req = http.expectOne((r) => r.url === '/api/products');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual([
      'cat',
      'ignore_digital',
      'limit',
      'offset',
      'query',
      'sort',
    ]);
    expect(req.request.params.get('query')).toBe('mario');
    expect(req.request.params.get('offset')).toBe('30');
    req.flush({ items: [], total_count: 0 });
  });

  it('preserves login body and token response', () => {
    TestBed.inject(AuthService)
      .authRequest({ user_login: 'tester', password: 'test' })
      .subscribe((response) => expect(response.token).toBe('token'));
    const req = http.expectOne('/api/login');
    expect(req.request.body).toEqual({ user_login: 'tester', password: 'test' });
    req.flush({ token: 'token' });
  });

  it('preserves every collection mutation URL, method and payload', () => {
    const api = TestBed.inject(CollectionService);
    const cases = [
      ['addToCollection', 'add_release'],
      ['removeFromCollection', 'remove_release'],
      ['setReleasePrice', 'set_release_price'],
      ['addWish', 'add_wish'],
      ['removeWish', 'remove_wish'],
      ['addBid', 'add_bid'],
      ['removeBid', 'remove_bid'],
      ['addWts', 'add_wts'],
      ['removeWts', 'remove_wts'],
    ] as const;
    for (const [method, url] of cases) {
      const payload = { release_id: 42, product_id: 7, price: 0 };
      api[method](payload).subscribe();
      const req = http.expectOne(`/api/${url}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    }
  });

  it('preserves collection, wishlist and WTS list contracts', () => {
    const api = TestBed.inject(CollectionService);
    for (const [method, url] of [
      ['getCollection', 'collection'],
      ['getWishlist', 'wishlist'],
      ['getWts', 'wts'],
    ] as const) {
      api[method]({ cat: 8, offset: 0, limit: 1000 }).subscribe();
      const req = http.expectOne((r) => r.url === `/api/${url}`);
      expect(req.request.params.get('cat')).toBe('8');
      expect(req.request.params.get('limit')).toBe('1000');
      req.flush({ items: [], total_count: 0 });
    }
  });

  it('cancels old catalog requests when filters change', () => {
    store.dispatch(new ProductsActions.SetRequestParams({ cat: 6, limit: 15, offset: 0 }));
    store.dispatch(new ProductsActions.LoadList());
    const old = http.expectOne((r) => r.url === '/api/products');
    store.dispatch(new ProductsActions.SetRequestParams({ cat: 8 }));
    store.dispatch(new ProductsActions.LoadList());
    expect(old.cancelled).toBe(true);
    const current = http.expectOne((r) => r.url === '/api/products');
    expect(current.request.params.get('cat')).toBe('8');
    current.flush({ items: [], total_count: 3 });
    expect(store.selectSnapshot(ProductsState.totalCountProducts)).toBe(3);
  });

  it('finishes the loading state after an API failure', () => {
    store.dispatch(new ProductsActions.LoadList());
    http.expectOne((r) => r.url === '/api/products').flush({}, { status: 500, statusText: 'Error' });
    expect(store.selectSnapshot(ProductsState.listLoading)).toBe(false);
    expect(store.selectSnapshot(ProductsState.listFailed)).toBe(true);
  });

  it('routes WTS failures to the correct action and never leaves Pending', async () => {
    const done = firstValueFrom(store.dispatch(new CollectionActions.RemoveWtsRequest({ release_id: 42 })));
    http.expectOne('/api/remove_wts').flush({}, { status: 500, statusText: 'Error' });
    await done;
    expect(store.selectSnapshot(CollectionState.changeStatus)).toBe(RequestStatus.Error);
    expect(CollectionActions.AddBidFail.type as string).not.toBe(CollectionActions.AddWishFail.type);
  });

  it('keeps zero prices and sends ownership refresh only after a successful mutation', async () => {
    const done = firstValueFrom(
      store.dispatch(new CollectionActions.SetPriceRequest({ release_id: 42, price: 0 })),
    );
    const req = http.expectOne('/api/set_release_price');
    expect(req.request.body).toEqual({ release_id: 42, price: 0 });
    req.flush(null);
    http.expectOne('/api/collection-stats').flush([]);
    await done;
    expect(store.selectSnapshot(CollectionState.changeStatus)).toBe(RequestStatus.Load);
  });
});
