import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router, RouterLink } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { CatalogGroupComponent } from './catalog-group.component';

describe('Franchise page', () => {
  const params = new BehaviorSubject(convertToParamMap({ id: '42' }));
  beforeEach(() => {
    params.next(convertToParamMap({ id: '42' }));
    TestBed.configureTestingModule({
      imports: [CatalogGroupComponent],
      providers: [...TEST_PROVIDERS, { provide: ActivatedRoute, useValue: { paramMap: params } }],
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify({ ignoreCancelled: true });
    vi.restoreAllMocks();
  });
  it('renders the franchise name and catalogue cards with absolute game links', () => {
    const fixture = TestBed.createComponent(CatalogGroupComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/franchises/42').flush({ id: 42, name: 'Test series', platform_ids: [48] });
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/products');
    expect(req.request.params.get('franchise_id')).toBe('42');
    req.flush({
      items: [{ id: 123, name: 'Test game', image_url: null, first_release_date: null }],
      total_count: 1,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test series');
    const router = TestBed.inject(Router);
    const links = fixture.debugElement.queryAll(By.directive(RouterLink)).map((element) => {
      const tree = element.injector.get(RouterLink).urlTree;
      return tree ? router.serializeUrl(tree) : '';
    });
    expect(links).toContain('/products/123;platform=48');
    expect(fixture.nativeElement.textContent).toContain('Test game');
    fixture.destroy();
  });
  it('cancels stale metadata and displays a 404 with a catalogue link', () => {
    const fixture = TestBed.createComponent(CatalogGroupComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const first = http.expectOne('/api/franchises/42');
    params.next(convertToParamMap({ id: '99' }));
    expect(first.cancelled).toBe(true);
    http.expectOne('/api/franchises/99').flush('Missing', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Франшиза не найдена');
    expect(fixture.nativeElement.querySelector('.empty a').getAttribute('href')).toBe('/products');
    fixture.destroy();
  });
  it('separates company roles and cancels requests from the previous tab', () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { paramMap: params, snapshot: { data: { catalogKind: 'company' } } },
    });
    const fixture = TestBed.createComponent(CatalogGroupComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http
      .expectOne('/api/companies/42')
      .flush({ id: 42, name: 'Studio', developer_platform_ids: [48], publisher_platform_ids: [167] });
    fixture.detectChanges();
    const developer = http.expectOne((r) => r.url === '/api/products');
    expect(developer.request.params.get('company_id')).toBe('42');
    expect(developer.request.params.get('company_role')).toBe('developer');
    expect(developer.request.params.get('cat')).toBe('48');
    expect(developer.request.params.has('franchise_id')).toBe(false);
    (fixture.nativeElement.querySelectorAll('.role-tabs button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(developer.cancelled).toBe(true);
    const publisher = http.expectOne((r) => r.url === '/api/products');
    expect(publisher.request.params.get('company_role')).toBe('publisher');
    expect(publisher.request.params.get('cat')).toBe('167');
    expect(publisher.request.params.get('offset')).toBe('0');
    publisher.flush({ items: [], total_count: 0 });
    fixture.destroy();
  });
});
