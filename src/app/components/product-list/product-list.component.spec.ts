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
    vi.unstubAllGlobals();
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

  it('keeps Unknown through filters and pagination, and clears it when returning to the catalogue', () => {
    fixture = TestBed.createComponent(ProductListComponent);
    store.reset({
      ...store.snapshot(),
      Platforms: { ...store.snapshot().Platforms, platforms: [
        { id: 48, abbreviation: 'PS4', europe_games: 100, america_games: 200, japan_games: 300, other_games: 400 },
      ] },
    });
    fixture.componentRef.setInput('unknown', true);
    fixture.detectChanges();
    const initial = nextRequest();
    expect(initial.request.params.get('unknown')).toBe('true');
    expect(initial.request.params.get('ignore_digital')).toBe('true');
    expect(fixture.nativeElement.querySelector('#onlyDigitalSwitch')).toBeNull();
    initial.flush({ items: [], total_count: 50, region_counts: { europe: 12, america: 15, japan: 9, other: 14 } });
    fixture.detectChanges();
    const regionButtons = [...fixture.nativeElement.querySelectorAll('app-region-filters button')]
      .map((button: any) => button.textContent.replace(/\s+/g, ' ').trim());
    expect(regionButtons).toEqual(['Европа 12 / 100', 'Америка 15 / 200', 'Япония 9 / 300', 'Другие 14 / 400']);
    expect(fixture.nativeElement.querySelector('app-region-filters').textContent).toContain('Неидентифицированные');
    fixture.componentInstance.toggleRegion('japan');
    const filtered = nextRequest();
    expect(filtered.request.params.get('unknown')).toBe('true');
    expect(filtered.request.params.get('regions')).toBe('japan');
    filtered.flush({ items: [], total_count: 50 });
    fixture.componentInstance.pageChanged(2);
    const page = nextRequest();
    expect(page.request.params.get('unknown')).toBe('true');
    page.flush({ items: [], total_count: 50 });
    fixture.destroy();
    mount();
    const regular = nextRequest();
    expect(regular.request.params.get('unknown')).toBe('false');
    expect(fixture.nativeElement.querySelector('#onlyDigitalSwitch')).not.toBeNull();
    expect(regular.request.params.get('offset')).toBe('0');
    regular.flush({ items: [], total_count: 50 });
  });
  it('requires explicit opt-in for undated games and resets the page on each toggle', () => {
    const component = mount();
    expect(component.queryForm.controls.includeUnreleased.value).toBe(false);
    const initial = nextRequest();
    expect(initial.request.params.get('include_unreleased')).not.toBe('true');
    initial.flush({ items: [], total_count: 50 });
    component.pageChanged(2);
    nextRequest().flush({ items: [], total_count: 50 });
    for (const enabled of [true, false]) {
      component.queryForm.controls.includeUnreleased.setValue(enabled);
      vi.advanceTimersByTime(300);
      const req = nextRequest();
      expect(req.request.params.get('include_unreleased')).toBe(String(enabled));
      expect(req.request.params.get('offset')).toBe('0');
      req.flush({ items: [], total_count: 0 });
    }
  });
  it('restores the undated checkbox from saved catalog filters', () => {
    store.dispatch(new ProductsActions.SetRequestParams({ cat: 48, include_unreleased: true }));
    const component = mount();
    expect(component.queryForm.controls.includeUnreleased.value).toBe(true);
    const req = nextRequest();
    expect(req.request.params.get('include_unreleased')).toBe('true');
    req.flush({ items: [], total_count: 0 });
  });
  it('replaces a saved PC page with the first PS4 page', () => {
    store.dispatch(new ProductsActions.SetRequestParams({ cat: 6, offset: 45 }));
    mount();
    const req = nextRequest();
    expect(req.request.params.get('cat')).toBe('48');
    expect(req.request.params.get('offset')).toBe('0');
    req.flush({ items: [], total_count: 0 });
  });
  it('marks missing serials only for non-digital games with known serial availability', () => {
    mount();
    nextRequest().flush({
      items: [
        { id: 1, name: 'Missing', has_serials: false },
        { id: 2, name: 'Known', has_serials: true },
        { id: 3, name: 'Old API' },
        { id: 4, name: 'Digital only', has_serials: false, digital_only: true },
      ],
      total_count: 4,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.missing-serial').length).toBe(1);
    expect(
      fixture.nativeElement.querySelector('.missing-serial').closest('.game-card').textContent,
    ).toContain('Missing');
  });
  it('marks ownership only on the platform of the owned release and updates when switching', () => {
    store.reset({
      ...store.snapshot(),
      Ownership: {
        ...store.snapshot().Ownership,
        ownership: [
          { platform: 48, have_prod_ids: [1], have_ids: [10] },
          { platform: 167, have_prod_ids: [], have_ids: [] },
        ],
      },
    });
    const component = mount();
    const response = { items: [{ id: 1, name: 'Cross-platform game' }], total_count: 1 };
    nextRequest().flush(response);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ownership-mark')).not.toBeNull();
    component.setActiveCategory(167);
    nextRequest().flush(response);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ownership-mark')).toBeNull();
    component.setActiveCategory(48);
    nextRequest().flush(response);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ownership-mark')).not.toBeNull();
  });
  it('sends platform-specific multiplayer filters and rating sort, resetting the page', () => {
    const component = mount();
    flushInitial();
    component.pageChanged(3);
    nextRequest().flush({ items: [], total_count: 50 });
    component.queryForm.patchValue({ sort: 'rating', localMultiplayer: true, onlineMultiplayer: true });
    vi.advanceTimersByTime(300);
    const req = nextRequest();
    expect(req.request.params.get('cat')).toBe('48');
    expect(req.request.params.get('sort')).toBe('rating');
    expect(req.request.params.get('local_multiplayer')).toBe('true');
    expect(req.request.params.get('online_multiplayer')).toBe('true');
    expect(req.request.params.get('offset')).toBe('0');
    req.flush({ items: [], total_count: 0 });
  });
  it('does not open the keyboard on touch devices when entering or switching platforms', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
    const component = mount();
    flushInitial();
    component.setActiveCategory(167);
    nextRequest().flush({ items: [], total_count: 0 });
    expect(focus).not.toHaveBeenCalled();
  });

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
  it('retains company role on pagination and removes it on returning to the catalogue', () => {
    fixture = TestBed.createComponent(ProductListComponent);
    fixture.componentRef.setInput('companyId', 42);
    fixture.componentRef.setInput('companyRole', 'publisher');
    fixture.componentRef.setInput('platformIds', [48]);
    fixture.detectChanges();
    nextRequest().flush({ items: [], total_count: 50 });
    fixture.componentInstance.pageChanged(2);
    let req = nextRequest();
    expect(req.request.params.get('company_role')).toBe('publisher');
    expect(req.request.params.get('company_id')).toBe('42');
    expect(req.request.params.get('offset')).toBe('15');
    req.flush({ items: [], total_count: 50 });
    fixture.destroy();
    mount();
    req = nextRequest();
    expect(req.request.params.has('company_id')).toBe(false);
    expect(req.request.params.has('company_role')).toBe(false);
    req.flush({ items: [], total_count: 50 });
  });
});
