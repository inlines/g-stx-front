import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { Store } from '@ngxs/store';
import { ProductListComponent } from './product-list.component';

describe('Catalog filters', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let http: HttpTestingController;
  let store: Store;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    TestBed.configureTestingModule({ imports: [ProductListComponent], providers: TEST_PROVIDERS });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
  });
  afterEach(() => {
    fixture?.destroy();
    http.verify({ ignoreCancelled: true });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  function mount() {
    fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }
  function nextRequest() {
    return http.expectOne((req) => req.url === '/api/products');
  }
  function flushInitial() {
    nextRequest().flush({ items: [], total_count: 100 });
  }

  it('restores the saved page with a single initial request', () => {
    store.dispatch(new ProductsActions.SetRequestParams({ cat: 8, offset: 45, query: 'Mario' }));
    mount();
    const req = nextRequest();
    expect(req.request.params.get('offset')).toBe('45');
    expect(req.request.params.get('cat')).toBe('8');
    req.flush({ items: [], total_count: 100 });
    vi.advanceTimersByTime(400);
    http.expectNone((req) => req.url === '/api/products');
  });
  it('debounces typing, trims search and resets pagination once', () => {
    const component = mount();
    flushInitial();
    component.pageChanged(4);
    nextRequest().flush({ items: [], total_count: 100 });
    component.queryForm.controls.query.setValue('M');
    vi.advanceTimersByTime(150);
    component.queryForm.controls.query.setValue(' Mario ');
    vi.advanceTimersByTime(300);
    const req = nextRequest();
    expect(req.request.params.get('query')).toBe('Mario');
    expect(req.request.params.get('offset')).toBe('0');
    req.flush({ items: [], total_count: 100 });
  });
  it('changes platform atomically even with a search waiting in the debounce', () => {
    const component = mount();
    flushInitial();
    component.queryForm.controls.query.setValue('pending search');
    component.setActiveCategory(8);
    const req = nextRequest();
    expect(req.request.params.get('cat')).toBe('8');
    expect(req.request.params.has('query')).toBe(false);
    expect(req.request.params.get('sort')).toBe('date');
    req.flush({ items: [], total_count: 100 });
    vi.advanceTimersByTime(500);
    http.expectNone((req) => req.url === '/api/products');
    expect(store.selectSnapshot(ProductsState.productsParams).query).toBeUndefined();
  });
  it('clears an already submitted search when changing platform or emptying the field', () => {
    const component = mount();
    flushInitial();
    component.queryForm.controls.query.setValue('Mario');
    vi.advanceTimersByTime(300);
    nextRequest().flush({ items: [], total_count: 10 });
    component.setActiveCategory(167);
    const platformRequest = nextRequest();
    expect(platformRequest.request.params.has('query')).toBe(false);
    expect(platformRequest.request.params.get('cat')).toBe('167');
    platformRequest.flush({ items: [], total_count: 100 });
    component.queryForm.controls.query.setValue('Zelda');
    vi.advanceTimersByTime(300);
    nextRequest().flush({ items: [], total_count: 10 });
    component.queryForm.controls.query.setValue('');
    vi.advanceTimersByTime(300);
    const cleared = nextRequest();
    expect(cleared.request.params.has('query')).toBe(false);
    cleared.flush({ items: [], total_count: 100 });
  });
  it('does not refetch when selecting the active platform', () => {
    const component = mount();
    flushInitial();
    component.setActiveCategory(component.activeCategory);
    vi.advanceTimersByTime(400);
    http.expectNone((req) => req.url === '/api/products');
  });
  it('cancels pending form work when leaving the page', () => {
    const component = mount();
    flushInitial();
    component.queryForm.controls.query.setValue('Mario');
    fixture.destroy();
    vi.advanceTimersByTime(400);
    http.expectNone((req) => req.url === '/api/products');
  });
  it('keeps the franchise filter through paging and platform changes, then clears it in the catalogue', () => {
    fixture = TestBed.createComponent(ProductListComponent);
    fixture.componentRef.setInput('franchiseId', 42);
    fixture.componentRef.setInput('platformIds', [48, 167]);
    fixture.detectChanges();
    let req = nextRequest();
    expect(req.request.params.get('franchise_id')).toBe('42');
    expect(req.request.params.get('cat')).toBe('48');
    req.flush({ items: [], total_count: 100 });
    fixture.componentInstance.pageChanged(2);
    req = nextRequest();
    expect(req.request.params.get('franchise_id')).toBe('42');
    expect(req.request.params.get('offset')).toBe('15');
    req.flush({ items: [], total_count: 100 });
    fixture.componentInstance.setActiveCategory(167);
    req = nextRequest();
    expect(req.request.params.get('franchise_id')).toBe('42');
    expect(req.request.params.get('cat')).toBe('167');
    expect(req.request.params.get('offset')).toBe('0');
    req.flush({ items: [], total_count: 100 });
    fixture.destroy();
    mount();
    req = nextRequest();
    expect(req.request.params.has('franchise_id')).toBe(false);
    req.flush({ items: [], total_count: 100 });
  });
});
