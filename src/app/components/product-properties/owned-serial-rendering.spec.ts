import { Clipboard } from '@angular/cdk/clipboard';
import { NgbModal, NgbConfig } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { Store } from '@ngxs/store';
import { HttpTestingController } from '@angular/common/http/testing';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';

import { ProductPropertiesComponent } from './product-properties.component';

describe('Owned serial rendering', () => {
  let component: ProductPropertiesComponent;
  let fixture: ComponentFixture<ProductPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        ...TEST_PROVIDERS,
        { provide: ActivatedRoute, useValue: { snapshot: {paramMap: convertToParamMap({platform:'9'})}, paramMap: of(convertToParamMap({platform:'9'})) } },
      ],
      imports: [ProductPropertiesComponent],
    }).compileComponents();

    TestBed.inject(NgbConfig).animation = false;
    fixture = TestBed.createComponent(ProductPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  for (const edition of ['standard', 'platinum', 'essentials', null]) it(`renders selected serial and ${edition} copy edition`, () => {
    const store = TestBed.inject(Store);
    const http = TestBed.inject(HttpTestingController);
    const state = store.snapshot();
    store.reset({...state, Auth: {...state.Auth, login: 'segasanshiro', token: 'test'}});
    component.demoPlatform = 9;
    const serial = ['BCES-00001', 'BCES-00001/E', 'BCES-00001/P/UK'];
    http.expectOne(req => req.url === '/api/library/collection').flush({
      items: [{release_id: 105244, product_id: 1278, platform_id: 9, region_id: 1, serial,
        selected_serial: 'BCES-00001', selected_edition: 'standard'}], total_count: 1,
    });
    http.expectNone(req => req.url === '/api/collection');
    store.dispatch(new ProductsActions.LoadProperties(1278));
    http.expectOne('/api/products/1278').flush({
      product: {id: 1278, name: 'Resistance: Fall of Man'},
      releases: [{release_id: 105244, platform_id: 9, platform_name: 'PS3',
        release_region: 'europe', release_date: 1174608000, serial, digital_only: false, serial_editions: edition ? [{serial:'BCES-00001', edition}] : []}],
      companies: [], franschises: [], screenshots: [],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detail-case .cover').getAttribute('data-edition')).toBe(edition === 'standard' ? null : edition);
    const highlighted = fixture.nativeElement.querySelectorAll('.owned-serial');
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].querySelector('.serial-copy').textContent.trim()).toBe('BCES-00001');
  });

});
