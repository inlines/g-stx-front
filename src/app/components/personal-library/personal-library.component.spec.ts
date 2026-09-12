import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LibraryCsvDownload } from '@app/shared/library-csv';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { Store } from '@ngxs/store';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { PersonalLibraryComponent } from './personal-library.component';

const items: ICollectionItem[] = Array.from({ length: 49 }, (_, i) => ({
  release_id: i + 1,
  product_id: i + 1,
  product_name: `Game ${String(i + 1).padStart(2, '0')}`,
  platform_name: 'PS4',
  region_name: 'Europe',
  release_date: 1000,
  image_url: null,
  serial: ['CUSA-12345'],
  price: i === 48 ? 0 : 100 + i,
}));
describe('Personal library pages', () => {
  let fixture: ComponentFixture<PersonalLibraryComponent>;
  let http: HttpTestingController;
  let store: Store;
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    TestBed.configureTestingModule({ imports: [PersonalLibraryComponent], providers: TEST_PROVIDERS });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
    const state = store.snapshot();
    store.reset({
      ...state,
      Collection: {
        ...state.Collection,
        collectionParams: { cat: 48 },
        wishlistParams: { cat: 48 },
        wtsParams: { cat: 48 },
      },
    });
  });
  afterEach(() => {
    fixture?.destroy();
    http.verify({ ignoreCancelled: true });
    vi.restoreAllMocks();
  });
  function mount(kind: 'collection' | 'wishlist' | 'wts' = 'collection') {
    fixture = TestBed.createComponent(PersonalLibraryComponent);
    fixture.componentRef.setInput('kind', kind);
    fixture.detectChanges();
    http.expectOne((r) => r.url === `/api/${kind}`).flush({ items, total_count: items.length });
    fixture.detectChanges();
    return fixture.componentInstance;
  }
  function cards() {
    return fixture.nativeElement.querySelectorAll('app-release-card');
  }
  it('opens the easter egg with only the current page and preserves collection data', async () => {
    const component = mount();
    component.page(3);
    fixture.detectChanges();
    const dialog = {
      componentInstance: { items: [] as ICollectionItem[] },
      close: vi.fn(),
      result: new Promise(() => {}),
    };
    const open = vi.spyOn(TestBed.inject(NgbModal), 'open').mockReturnValue(dialog as never);
    await component.openSnow();
    expect(open).toHaveBeenCalledOnce();
    expect(dialog.componentInstance.items.map((x) => x.release_id)).toEqual([49]);
    expect(dialog.componentInstance.items[0]).not.toBe(items[48]);
    await component.openSnow();
    expect(open).toHaveBeenCalledOnce();
    fixture.destroy();
    expect(dialog.close).toHaveBeenCalledOnce();
  });
  it('renders only 24 releases and clamps the last page after removal', () => {
    const component = mount();
    expect(cards().length).toBe(24);
    component.page(3);
    fixture.detectChanges();
    expect(cards().length).toBe(1);
    store.dispatch(
      new CollectionActions.GetCollectionSuccess({ items: items.slice(0, 48), total_count: 48 }),
    );
    fixture.detectChanges();
    expect(component.view.page).toBe(2);
    expect(cards().length).toBe(24);
  });
  it('searches and sorts the entire collection before slicing pages', () => {
    const component = mount();
    component.page(2);
    component.query.setValue('Game 49');
    fixture.detectChanges();
    expect(component.view.page).toBe(1);
    expect(cards().length).toBe(1);
    expect(cards()[0].textContent).toContain('Game 49');
    component.query.setValue('');
    component.sort('price');
    fixture.detectChanges();
    expect(cards()[0].textContent).toContain('Game 49');
  });
  it('restores page and sort after returning to the section', () => {
    let component = mount();
    component.sort('date');
    component.page(2);
    fixture.detectChanges();
    fixture.destroy();
    component = mount();
    expect(component.view.page).toBe(2);
    expect(component.view.sort).toBe('date');
    expect(cards()[0].textContent).toContain('Game 25');
  });
  it('resets pagination when changing platform', () => {
    const component = mount();
    component.page(3);
    component.selectPlatform(167);
    const req = http.expectOne((r) => r.url === '/api/collection');
    expect(req.request.params.get('cat')).toBe('167');
    req.flush({ items: items.slice(0, 2), total_count: 2 });
    fixture.detectChanges();
    expect(component.view.page).toBe(1);
    expect(cards().length).toBe(2);
  });
  it('uses the same paged cards for wishlist without collection-only actions', () => {
    mount('wishlist');
    expect(cards().length).toBe(24);
    expect(fixture.nativeElement.querySelector('input[type=search]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Цена покупки');
    expect(fixture.nativeElement.querySelector('details')).toBeNull();
  });
  it('shows a single serial directly without a redundant disclosure', () => {
    mount();
    expect(fixture.nativeElement.querySelector('app-serial-list').textContent).toContain('CUSA-12345');
    expect(fixture.nativeElement.querySelector('app-serial-list details')).toBeNull();
  });
  it('prepopulates the price editor, including a legitimate zero', () => {
    const component = mount();
    component.edit(items[48]);
    expect(component.price.value).toBe(0);
    component.price.setValue(-1);
    expect(component.price.invalid).toBe(true);
    component.price.setValue(0);
    expect(component.price.valid).toBe(true);
  });
  function ownership(selling: number[] = []) {
    return [
      {
        platform: 48,
        have_count: 49,
        have_ids: items.map((i) => i.release_id),
        have_prod_ids: items.map((i) => i.product_id),
        wish_count: 0,
        wish_ids: [],
        wts_count: selling.length,
        wts_ids: selling,
        total_spent: 100,
      },
    ];
  }
  function seedOwnership(selling: number[] = []) {
    const state = store.snapshot();
    store.reset({ ...state, Ownership: { ...state.Ownership, ownership: ownership(selling) } });
  }
  it('paginates WTS like wishlist and hides purchase controls', () => {
    const component = mount('wts');
    expect(cards().length).toBe(24);
    expect(cards()[0].textContent).toContain('Цена продажи');
    expect(cards()[0].textContent).not.toContain('Цена покупки');
    component.page(3);
    fixture.detectChanges();
    expect(cards().length).toBe(1);
  });
  it('offers an owned release for sale and refreshes its marker', () => {
    seedOwnership();
    const component = mount();
    const button = fixture.nativeElement.querySelector('.sale-action button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    http.expectNone('/api/add_wts');
    expect(component.salePrice.value).toBeNull();
    component.salePrice.setValue(1500);
    component.saleCib.setValue(true);
    fixture.detectChanges();
    (document.querySelector('ngb-modal-window button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const req = http.expectOne('/api/add_wts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ release_id: 1, price: 1500, cib: true });
    expect(button.disabled).toBe(true);
    req.flush(null);
    http.expectOne('/api/collection-stats').flush(ownership([1]));
    http.expectOne((r) => r.url === '/api/collection').flush({ items, total_count: items.length });
    fixture.detectChanges();
    expect(button.textContent).toContain('Снять с продажи');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
  it('keeps the original sale status after a failed request', () => {
    seedOwnership();
    const component = mount();
    component.toggleSale(items[0]);
    component.saveSale();
    http.expectOne('/api/add_wts').flush('Failed', { status: 500, statusText: 'Server error' });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.sale-action button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent).toContain('Выставить на продажу');
  });
  it('removes only the sale flag from WTS and shows the collection link when empty', () => {
    seedOwnership([1]);
    mount('wts');
    (fixture.nativeElement.querySelector('.sale-remove') as HTMLButtonElement).click();
    const req = http.expectOne('/api/remove_wts');
    expect(req.request.body).toEqual({ release_id: 1 });
    req.flush(null);
    http.expectOne('/api/collection-stats').flush(ownership());
    http.expectOne((r) => r.url === '/api/wts').flush({ items: [], total_count: 0 });
    fixture.detectChanges();
    expect(cards().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.empty a').getAttribute('href')).toBe('/collection');
    expect(store.selectSnapshot(OwnershipState.hasRelease(1))).toBe(true);
    http.expectNone('/api/remove_release');
  });
  it('can withdraw a sale directly from the collection', () => {
    seedOwnership([1]);
    const component = mount();
    component.toggleSale(items[0]);
    http.expectOne('/api/remove_wts').flush(null);
    http.expectOne('/api/collection-stats').flush(ownership());
    http.expectOne((r) => r.url === '/api/collection').flush({ items, total_count: items.length });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sale-action button').getAttribute('aria-pressed')).toBe(
      'false',
    );
  });
  it('does not offer unowned releases and excludes platforms without WTS flags', () => {
    seedOwnership();
    const component = mount();
    component.toggleSale({ ...items[0], release_id: 999 });
    http.expectNone('/api/add_wts');
    expect(store.selectSnapshot(OwnershipState.activeWtsPlatforms)).toEqual([]);
    seedOwnership([1]);
    expect(store.selectSnapshot(OwnershipState.activeWtsPlatforms)).toEqual([48]);
  });
  it('prepopulates sale details and saves a zero price and cleared CIB flag', () => {
    const component = mount('wts');
    component.editSale({ ...items[0], price: 850, cib: true });
    expect(component.salePrice.value).toBe(850);
    expect(component.saleCib.value).toBe(true);
    component.salePrice.setValue(0);
    component.saleCib.setValue(false);
    component.saveSale();
    const req = http.expectOne('/api/add_wts');
    expect(req.request.body).toEqual({ release_id: 1, price: 0, cib: false });
    req.flush(null);
    http.expectOne('/api/collection-stats').flush(ownership([1]));
    http
      .expectOne((r) => r.url === '/api/wts')
      .flush({ items: [{ ...items[0], price: 0, cib: false }], total_count: 1 });
    fixture.detectChanges();
    expect(cards()[0].querySelector('.price').textContent).toContain('0');
    expect(cards()[0].textContent).toContain('Полный комплект не отмечен');
  });
  it('validates sale price and allows leaving it unspecified', () => {
    const component = mount('wts');
    component.editSale(items[0]);
    for (const value of [-1, 1.5, 2147483648]) {
      component.salePrice.setValue(value);
      expect(component.salePrice.invalid).toBe(true);
      component.saveSale();
    }
    http.expectNone('/api/add_wts');
    component.salePrice.setValue(null);
    component.saveSale();
    const req = http.expectOne('/api/add_wts');
    expect(req.request.body).toEqual({ release_id: 1, price: null, cib: false });
    req.flush(null);
    http.expectOne('/api/collection-stats').flush(ownership([1]));
    http
      .expectOne((r) => r.url === '/api/wts')
      .flush({ items: [{ ...items[0], price: null, cib: true }], total_count: 1 });
    fixture.detectChanges();
    expect(cards()[0].textContent).toContain('CIB · Полный комплект');
    expect(cards()[0].textContent).toContain('Не указана');
  });
  it('submits the purchase price by clicking the modal save button', () => {
    const component = mount();
    component.edit(items[0]);
    component.price.setValue(500);
    fixture.detectChanges();
    (document.querySelector('ngb-modal-window button[type="submit"]') as HTMLButtonElement).click();
    const req = http.expectOne('/api/set_release_price');
    expect(req.request.body).toEqual({ release_id: 1, price: 500 });
    req.flush(null);
    http.expectOne('/api/collection-stats').flush(ownership());
    http.expectOne((r) => r.url === '/api/collection').flush({ items, total_count: items.length });
  });
  it.each(['collection', 'wishlist', 'wts'] as const)('exports the entire %s through its button', (kind) => {
    const save = vi.spyOn(TestBed.inject(LibraryCsvDownload), 'save').mockImplementation(() => {});
    const component = mount(kind);
    component.page(2);
    if (kind === 'collection') component.query.setValue('Game 49');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.csv-export') as HTMLButtonElement).click();
    expect(save).toHaveBeenCalledOnce();
    const [csv, filename] = save.mock.calls[0];
    expect(csv).toContain('Game 01');
    expect(csv).toContain('Game 49');
    expect(filename).toMatch(new RegExp('^' + kind + '-48-.*\\.csv$'));
    expect(csv).toContain(
      kind === 'wts' ? 'Цена продажи' : kind === 'collection' ? 'Цена покупки' : 'Название',
    );
  });
});
