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
    http
      .expectOne('/api/products/1')
      .flush({
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
});
