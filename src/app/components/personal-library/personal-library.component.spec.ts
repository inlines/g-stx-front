import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
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
      Collection: { ...state.Collection, collectionParams: { cat: 48 }, wishlistParams: { cat: 48 } },
    });
  });
  afterEach(() => {
    fixture?.destroy();
    http.verify({ ignoreCancelled: true });
    vi.restoreAllMocks();
  });
  function mount(kind: 'collection' | 'wishlist' = 'collection') {
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
  it('exposes all serials through a keyboard-accessible disclosure', () => {
    mount();
    const disclosure = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    expect(disclosure.open).toBe(false);
    disclosure.querySelector('summary')!.click();
    expect(disclosure.open).toBe(true);
    expect(disclosure.textContent).toContain('CUSA-12345');
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
});
