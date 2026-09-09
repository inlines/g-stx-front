import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Store } from '@ngxs/store';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { RequestStatus } from '@app/constants/request-status.const';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectorsActions } from '@app/states/collectors/states/collectors-actions';
import { CollectorsState } from '@app/states/collectors/states/collectors.state';
import { CollectorPropertiesComponent } from './collector-properties.component';
const items: ICollectionItem[] = Array.from({ length: 49 }, (_, i) => ({
  release_id: i + 1,
  product_id: i + 1,
  product_name: `Release ${i + 1}`,
  release_date: null,
  platform_name: 'PS4',
  region_name: 'Europe',
  image_url: null,
  serial: ['CUSA-00001', 'CUSA-00002'],
  price: null,
}));
describe('Collector library', () => {
  let fixture: ComponentFixture<CollectorPropertiesComponent>;
  let store: Store;
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    TestBed.configureTestingModule({ imports: [CollectorPropertiesComponent], providers: TEST_PROVIDERS });
    store = TestBed.inject(Store);
    seed('alice');
    fixture = TestBed.createComponent(CollectorPropertiesComponent);
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    TestBed.inject(HttpTestingController).verify({ ignoreCancelled: true });
    vi.restoreAllMocks();
  });
  function seed(login: string) {
    const state = store.snapshot();
    store.reset({
      ...state,
      Collectors: {
        ...state.Collectors,
        collectionPropertiesLogin: login,
        loadedCollection: items,
        collectorPropertiesRequestStatus: RequestStatus.Load,
      },
    });
  }
  it('paginates and keeps collection cards read-only', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('app-release-card').length).toBe(24);
    expect(host.querySelector('.release-card .remove')).toBeNull();
    expect(host.textContent).not.toContain('Цена покупки');
    expect(host.textContent).toContain('Написать');
    fixture.componentInstance.page(3);
    fixture.detectChanges();
    expect(host.querySelectorAll('app-release-card').length).toBe(1);
    expect(host.textContent).toContain('Release 49');
  });
  it('keeps all serials accessible and does not pass a null platform to the product route', () => {
    const host = fixture.nativeElement as HTMLElement;
    const disclosure = host.querySelector('details')!;
    disclosure.querySelector('summary')!.click();
    expect(disclosure.open).toBe(true);
    expect(disclosure.textContent).toContain('CUSA-00002');
    expect(host.querySelector('.release-title')!.getAttribute('href')).toBe('/products/1');
    expect(host.textContent).toContain('Дата релиза не указана');
  });
  it('keeps a separate page for each collector', () => {
    fixture.componentInstance.page(2);
    seed('bob');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.release-title').textContent).toBe('Release 1');
    seed('alice');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.release-title').textContent).toBe('Release 25');
  });
  it('preserves a missing release date instead of converting it to 1970', () => {
    store.dispatch(new CollectorsActions.GetCollectorsPropertiesSuccess(items));
    expect(store.selectSnapshot(CollectorsState.loadedCollection)[0].release_date).toBeNull();
  });
  it('loads sale cards from the selected collector and keeps them read-only', () => {
    const http = TestBed.inject(HttpTestingController);
    fixture.componentInstance.page(2);
    (fixture.nativeElement.querySelectorAll('.library-tabs button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === '/api/collectors/alice/wts')
      .flush(items.map((i) => ({ ...i, price: 1500, cib: true })));
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('app-release-card').length).toBe(24);
    expect(host.textContent).toContain('Цена продажи');
    expect(host.textContent).toContain('CIB · Полный комплект');
    expect(host.querySelector('.release-card button')).toBeNull();
    expect(host.querySelector('details')).toBeNull();
    fixture.componentInstance.page(3);
    fixture.detectChanges();
    expect(host.querySelectorAll('app-release-card').length).toBe(1);
    fixture.componentInstance.selectTab('collection');
    fixture.detectChanges();
    expect(host.querySelector('.release-title')!.textContent).toBe('Release 25');
  });
  it('cancels a pending sale request when navigating to another collector', () => {
    const http = TestBed.inject(HttpTestingController);
    fixture.componentInstance.selectTab('wts');
    fixture.detectChanges();
    const old = http.expectOne((r) => r.url === '/api/collectors/alice/wts');
    seed('bob');
    fixture.detectChanges();
    expect(old.cancelled).toBe(true);
    http.expectOne((r) => r.url === '/api/collectors/bob/wts').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Пока нет игр для продажи');
  });
  it('supports retry and fetches sale lists beyond 1000 releases', () => {
    const http = TestBed.inject(HttpTestingController);
    fixture.componentInstance.selectTab('wts');
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === '/api/collectors/alice/wts')
      .flush('error', { status: 500, statusText: 'error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    fixture.componentInstance.retry();
    const first = http.expectOne((r) => r.url === '/api/collectors/alice/wts');
    expect(first.request.params.get('offset')).toBe('0');
    first.flush(Array.from({ length: 1000 }, (_, i) => ({ ...items[0], release_id: i + 1 })));
    const next = http.expectOne((r) => r.url === '/api/collectors/alice/wts');
    expect(next.request.params.get('offset')).toBe('1000');
    next.flush([{ ...items[0], release_id: 1001 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Релизов: 1001');
  });
});
