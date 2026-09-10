import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { AdminRequestsComponent } from './admin-requests.component';
import { SerialRequest } from '@app/services/serial-requests.service';
const item: SerialRequest = {
  id: 3,
  release_id: 12,
  product_id: 5,
  product_name: 'Game',
  platform_id: 48,
  platform_name: 'PS4',
  region_id: 1,
  region_name: 'Europe',
  release_date: null,
  digital_only: false,
  existing_serials: Array.from({ length: 20 }, (_, i) => `CUSA-${i}`),
  serial: 'CUSA-NEW',
  submitter: 'collector',
  status: 'pending',
  created_at: '2026-09-10T10:00:00Z',
  reviewed_at: null,
  reviewer: null,
};
describe('Serial request moderation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AdminRequestsComponent], providers: TEST_PROVIDERS });
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL() {
          return 'blob:evidence';
        }
        static override revokeObjectURL() {}
      },
    );
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.unstubAllGlobals();
  });
  function setup() {
    const fixture = TestBed.createComponent(AdminRequestsComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne((r) => r.url === '/api/admin/serial-requests').flush({ items: [item], total_count: 1 });
    fixture.detectChanges();
    http.expectOne('/api/admin/serial-requests/3/photo').flush(new Blob(['jpeg'], { type: 'image/jpeg' }));
    fixture.detectChanges();
    return { fixture, http, component: fixture.componentInstance };
  }
  it('shows the exact game/release/region, proposed serial, all existing serials and evidence', () => {
    const { fixture } = setup();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Game');
    expect(root.textContent).toContain('PS4 · Europe');
    expect(root.textContent).toContain('Релиз #12');
    expect(root.querySelector('.proposed strong')?.textContent).toBe('CUSA-NEW');
    const serials = root.querySelector<HTMLDetailsElement>('details')!;
    expect(serials.open).toBe(false);
    expect(serials.querySelectorAll('li')).toHaveLength(20);
    expect(root.querySelector('app-request-photo img')).not.toBeNull();
    fixture.destroy();
  });
  it('waits for confirmation, accepts once, then switches to a read-only archive', () => {
    const { fixture, component, http } = setup();
    (fixture.nativeElement.querySelector('button.accept') as HTMLButtonElement).click();
    http.expectNone((r) => r.method === 'POST');
    component.confirm();
    component.confirm();
    http
      .expectOne('/api/admin/serial-requests/3/accept')
      .flush(null, { status: 204, statusText: 'No content' });
    http.expectOne((r) => r.url === '/api/admin/serial-requests').flush({ items: [], total_count: 0 });
    component.select('accepted');
    const archive = http.expectOne((r) => r.url === '/api/admin/serial-requests');
    expect(archive.request.params.get('status')).toBe('accepted');
    archive.flush({
      items: [{ ...item, status: 'accepted', reviewed_at: '2026-09-10T12:00:00Z', reviewer: 'admin' }],
      total_count: 1,
    });
    fixture.detectChanges();
    // A new photo request is needed only if Angular destroyed the previous row.
    for (const req of http.match('/api/admin/serial-requests/3/photo')) req.flush(new Blob(['jpeg']));
    expect(fixture.nativeElement.querySelector('button.accept')).toBeNull();
    expect(fixture.nativeElement.querySelector('button.reject')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Принял: admin');
    fixture.destroy();
  });
  it('rejects with DELETE, keeps failure visible and allows retry', () => {
    const { fixture, component, http } = setup();
    component.decision = { item, action: 'reject' };
    component.confirm();
    const req = http.expectOne('/api/admin/serial-requests/3');
    expect(req.request.method).toBe('DELETE');
    req.flush({ error: 'Сбой удаления' }, { status: 500, statusText: 'Error' });
    expect(component.error).toBe('Сбой удаления');
    expect(component.busy).toBe(false);
    component.confirm();
    http.expectOne('/api/admin/serial-requests/3').flush(null);
    http.expectOne((r) => r.url === '/api/admin/serial-requests').flush({ items: [], total_count: 0 });
    expect(component.success).toContain('фотография удалены');
    fixture.destroy();
  });
});
