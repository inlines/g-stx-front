import { NgbModal, NgbConfig } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { Store } from '@ngxs/store';
import { HttpTestingController } from '@angular/common/http/testing';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';

import { ProductPropertiesComponent } from './product-properties.component';

describe('ProductPropertiesComponent', () => {
  let component: ProductPropertiesComponent;
  let fixture: ComponentFixture<ProductPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        ...TEST_PROVIDERS,
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
      ],
      imports: [ProductPropertiesComponent],
    }).compileComponents();

    TestBed.inject(NgbConfig).animation = false;
    fixture = TestBed.createComponent(ProductPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  afterEach(() => {
    TestBed.inject(NgbModal).dismissAll();
    fixture.destroy();
    TestBed.inject(HttpTestingController).verify();
  });

  it('shows a catalogue link for a missing game and clears the error on navigation', () => {
    const store = TestBed.inject(Store);
    const http = TestBed.inject(HttpTestingController);
    store.dispatch(new ProductsActions.LoadProperties(999));
    http.expectOne('/api/products/999').flush('Product not found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Игра не найдена');
    expect(fixture.nativeElement.querySelector('.product-error a').getAttribute('href')).toBe('/products');
    expect(fixture.nativeElement.querySelector('.spinner-border')).toBeNull();
    store.dispatch(new ProductsActions.LoadProperties(1));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.product-error')).toBeNull();
    http.expectOne('/api/products/1').flush({
      product: { id: 1, name: 'Existing game', image_url: null, first_release_date: null },
      releases: [],
      screenshots: [],
      companies: [],
      franschises: [],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Existing game');
  });

  it('does not describe server failures as a missing game', () => {
    TestBed.inject(Store).dispatch(new ProductsActions.LoadProperties(1));
    TestBed.inject(HttpTestingController)
      .expectOne('/api/products/1')
      .flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Не удалось загрузить игру');
    expect(fixture.nativeElement.textContent).not.toContain('Игра не найдена');
  });
  it('links developers and publishers by company ID, not involvement ID', () => {
    TestBed.inject(Store).dispatch(new ProductsActions.LoadProperties(1));
    TestBed.inject(HttpTestingController)
      .expectOne('/api/products/1')
      .flush({
        product: { id: 1, name: 'Game', image_url: null, first_release_date: null },
        releases: [],
        screenshots: [],
        franschises: [],
        companies: [{ id: 999, company: 42, name: 'Studio', developer: true, publisher: true }],
      });
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('a[href="/companies/42"]');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Studio');
    expect(fixture.nativeElement.querySelector('a[href="/companies/999"]')).toBeNull();
  });
  it('keeps every serial, release and metadata field while serial lists start collapsed', () => {
    const serials = Array.from({ length: 60 }, (_, index) => `CUSA-${index}`);
    TestBed.inject(Store).dispatch(new ProductsActions.LoadProperties(1));
    TestBed.inject(HttpTestingController)
      .expectOne('/api/products/1')
      .flush({
        product: {
          id: 1,
          name: 'Game',
          image_url: null,
          first_release_date: null,
          alternative_names: ['Alias one', 'Alias two'],
          summary: 'Full description',
        },
        releases: [
          {
            release_id: 1,
            platform_id: 48,
            platform_name: 'PS4',
            release_region: 'Europe',
            release_date: 1000,
            release_status: 0,
            digital_only: false,
            serial: serials,
            seller_logins: [],
          },
          {
            release_id: 2,
            platform_id: 49,
            platform_name: 'Xbox',
            release_region: 'Japan',
            release_date: null,
            release_status: 5,
            digital_only: false,
            serial: ['ABC', 'ABC'],
            seller_logins: [],
          },
          {
            release_id: 3,
            platform_id: 6,
            platform_name: 'PC',
            release_region: 'World',
            release_date: null,
            release_status: 0,
            digital_only: true,
            serial: null,
            seller_logins: [],
          },
        ],
        screenshots: ['https://example.test/screen.jpg'],
        companies: [],
        franschises: [{ franschise_id: 2, franschise_name: 'Series', total_games_count: 5 }],
      });
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.release-item')).toHaveLength(3);
    const lists = root.querySelectorAll<HTMLDetailsElement>('details.serials');
    expect(lists).toHaveLength(2);
    expect(lists[0].open).toBe(false);
    expect(lists[0].querySelector('summary')?.textContent).toContain('60');
    lists[0].querySelector('summary')!.click();
    expect(lists[0].open).toBe(true);
    expect(Array.from(lists[0].querySelectorAll('li'), (li) => li.textContent)).toEqual(serials);
    expect(lists[1].querySelectorAll('li')).toHaveLength(2);
    for (const text of [
      'PS4',
      'Europe',
      'Xbox',
      'Japan',
      'PC',
      'World',
      'Цифровая версия',
      'Дата не указана',
      'Alias one',
      'Alias two',
      'Full description',
      'Series',
    ]) {
      expect(root.textContent).toContain(text);
    }
    expect(root.querySelectorAll('.text-decoration-line-through')).toHaveLength(1);
    expect(root.querySelector('img.screenshot')?.getAttribute('alt')).toBe('Game — скриншот 1');
    expect(root.querySelector('button[aria-label="Назад"]')).not.toBeNull();
  });
  it.each([null, '48'])('shows working actions regardless of the platform URL parameter (%s)', (platform) => {
    const route = TestBed.inject(ActivatedRoute);
    Object.defineProperty(route, 'paramMap', {
      value: of(convertToParamMap(platform ? { platform } : {})),
      configurable: true,
    });
    component.ngOnInit();
    component.isAuthorised$ = of(true);
    const store = TestBed.inject(Store);
    store.dispatch(new ProductsActions.LoadProperties(1));
    TestBed.inject(HttpTestingController)
      .expectOne('/api/products/1')
      .flush({
        product: { id: 1, name: 'Game', image_url: null, first_release_date: null },
        releases: [48, 49].map((platform_id, i) => ({
          release_id: i + 10,
          platform_id,
          platform_name: 'Platform',
          release_region: 'Europe',
          release_date: 1000,
          release_status: 0,
          digital_only: false,
          serial: [],
          seller_logins: [],
        })),
        companies: [],
        franschises: [],
        screenshots: [],
      });
    fixture.detectChanges();
    const dispatch = vi.spyOn(store, 'dispatch').mockReturnValue(of(undefined));
    const rows = fixture.nativeElement.querySelectorAll('.release-item') as NodeListOf<HTMLElement>;
    expect(rows).toHaveLength(2);
    rows.forEach((row, i) => {
      const buttons = Array.from(row.querySelectorAll('button'));
      const collection = buttons.find((button) => button.textContent?.trim() === 'В коллекцию')!;
      const wishlist = buttons.find((button) => button.textContent?.trim() === 'В вишлист')!;
      expect(collection.hidden || collection.disabled).toBe(false);
      expect(wishlist.hidden || wishlist.disabled).toBe(false);
      collection.click();
      expect(dispatch).toHaveBeenLastCalledWith(
        new CollectionActions.AddToCollectionRequest({ release_id: i + 10, product_id: 1 }),
      );
      wishlist.click();
      expect(dispatch).toHaveBeenLastCalledWith(new CollectionActions.AddWishRequest({ release_id: i + 10 }));
    });
    expect(fixture.nativeElement.querySelectorAll('.highlighted-release')).toHaveLength(platform ? 1 : 0);
    dispatch.mockRestore();
    component.isAuthorised$ = of(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.release-actions')).toBeNull();
  });
  it('offers owned releases for sale with price and CIB, then withdraws the sale', () => {
    const store = TestBed.inject(Store);
    const http = TestBed.inject(HttpTestingController);
    const ownership = (wts: number[]) => [
      {
        platform: 48,
        have_ids: [10],
        have_count: 1,
        have_prod_ids: [1],
        wish_ids: [],
        wish_count: 0,
        wts_ids: wts,
        wts_count: wts.length,
        total_spent: 0,
      },
    ];
    const state = store.snapshot();
    store.reset({ ...state, Ownership: { ...state.Ownership, ownership: ownership([]) } });
    component.isAuthorised$ = of(true);
    store.dispatch(new ProductsActions.LoadProperties(1));
    http.expectOne('/api/products/1').flush({
      product: { id: 1, name: 'Game', image_url: null, first_release_date: null },
      releases: [10, 11].map((release_id) => ({
        release_id,
        platform_id: 48,
        platform_name: 'PS4',
        release_region: 'Europe',
        release_date: 1000,
        release_status: 0,
        digital_only: false,
        serial: [],
        seller_logins: ['bob'],
      })),
      companies: [],
      franschises: [],
      screenshots: [],
    });
    fixture.detectChanges();
    const button = (label: string) =>
      Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
        (item) => item.textContent?.trim() === label,
      )!;
    expect(fixture.nativeElement.querySelectorAll('.release-actions .btn-pink')).toHaveLength(1);
    button('Хочу продать').click();
    fixture.detectChanges();
    expect(component.salePrice.value).toBeNull();
    expect(component.saleCib.value).toBe(false);
    component.salePrice.setValue(-1);
    component.saveSale();
    http.expectNone('/api/add_wts');
    component.salePrice.setValue(0);
    component.saleCib.setValue(true);
    fixture.detectChanges();
    (document.querySelector('.sale-dialog button[type=submit]') as HTMLButtonElement).click();
    const request = http.expectOne('/api/add_wts');
    expect(request.request.body).toEqual({ release_id: 10, price: 0, cib: true });
    request.flush(null);
    http.expectOne('/api/collection-stats').flush(ownership([10]));
    fixture.detectChanges();
    button('Снять с продажи').click();
    const removal = http.expectOne('/api/remove_wts');
    expect(removal.request.body).toEqual({ release_id: 10 });
    removal.flush(null);
    http.expectOne('/api/collection-stats').flush(ownership([]));
    fixture.detectChanges();
    expect(button('Хочу продать')).toBeTruthy();
    button('Кто продаёт').click();
    fixture.detectChanges();
    expect(document.querySelector('ngb-modal-window')?.textContent).toContain('bob');
    expect(document.querySelector('ngb-modal-window')?.textContent).toContain('Написать игроку');
    http.expectNone('/api/add_bid');
    http.expectNone('/api/remove_bid');
  });
});
