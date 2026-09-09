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
      providers: TEST_PROVIDERS,
      imports: [ProductPropertiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  afterEach(() => {
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
            bid_user_logins: [],
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
            bid_user_logins: [],
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
            bid_user_logins: [],
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
});
