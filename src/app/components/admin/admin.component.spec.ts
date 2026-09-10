import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { NgbConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { AdminComponent } from './admin.component';

const me = { id: 1, user_login: 'segasanshiro', is_admin: true, created_at: null };
const other = { id: 2, user_login: 'collector', is_admin: false, created_at: null };
describe('Admin users', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AdminComponent], providers: TEST_PROVIDERS });
    TestBed.inject(NgbConfig).animation = false;
  });
  afterEach(() => {
    TestBed.inject(NgbModal).dismissAll();
    TestBed.inject(HttpTestingController).verify();
  });
  function setup() {
    const fixture = TestBed.createComponent(AdminComponent);
    fixture.componentRef.setInput('currentUserId', 1);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne((r) => r.url === '/api/admin/users').flush({ items: [me, other], total_count: 2 });
    fixture.detectChanges();
    return { fixture, http, component: fixture.componentInstance };
  }
  it('shows roles and no actions on the current account; requests stay empty', () => {
    const { fixture, component, http } = setup();
    const rows = fixture.nativeElement.querySelectorAll('.users li');
    expect(rows[0].querySelector('button')).toBeNull();
    expect(rows[0].textContent).toContain('Администратор');
    expect(rows[1].querySelectorAll('button').length).toBe(2);
    component.section = 'requests';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Здесь пока пусто');
    http.expectNone((r) => r.url.includes('requests'));
    fixture.destroy();
  });
  it('searches on the server and cancels a stale page request', () => {
    const { fixture, component, http } = setup();
    component.pageChanged(2);
    const stale = http.expectOne((r) => r.url === '/api/admin/users');
    expect(stale.request.params.get('offset')).toBe('20');
    component.query = '  COL  ';
    component.searchUsers();
    expect(stale.cancelled).toBe(true);
    const req = http.expectOne((r) => r.url === '/api/admin/users');
    expect(req.request.params.get('query')).toBe('COL');
    expect(req.request.params.get('offset')).toBe('0');
    req.flush({ items: [other], total_count: 1 });
    fixture.destroy();
  });
  it('requires the exact login before deleting and keeps a failure in the modal', async () => {
    const { fixture, component, http } = setup();
    (fixture.nativeElement.querySelector('.users .danger') as HTMLButtonElement).click();
    component.confirm();
    http.expectNone((r) => r.method === 'DELETE');
    component.confirmation = 'COLLECTOR';
    component.confirm();
    http.expectNone((r) => r.method === 'DELETE');
    component.confirmation = other.user_login;
    component.confirm();
    component.confirm(); // Double click must produce one request.
    const deletion = http.expectOne('/api/admin/users/2');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ error: 'Ошибка удаления' }, { status: 500, statusText: 'Error' });
    expect(component.actionError).toBe('Ошибка удаления');
    expect(component.busy).toBe(false);
    expect(TestBed.inject(NgbModal).hasOpenModals()).toBe(true);
    component.confirm();
    http.expectOne('/api/admin/users/2').flush(null, { status: 204, statusText: 'No content' });
    http.expectOne((r) => r.url === '/api/admin/users').flush({ items: [me], total_count: 1 });
    expect(component.success).toContain('удалён');
    await vi.waitFor(() => expect(TestBed.inject(NgbModal).hasOpenModals()).toBe(false));
    fixture.destroy();
  });
  it('cancelling a confirmation makes no mutation; promotion refreshes the list', () => {
    const { fixture, component, http } = setup();
    (fixture.nativeElement.querySelector('.users .actions button') as HTMLButtonElement).click();
    component.cancel();
    http.expectNone((r) => r.method === 'POST' || r.method === 'DELETE');
    (fixture.nativeElement.querySelector('.users .actions button') as HTMLButtonElement).click();
    component.confirm();
    const promotion = http.expectOne('/api/admin/users/2/promote');
    expect(promotion.request.method).toBe('POST');
    promotion.flush({ ...other, is_admin: true });
    http
      .expectOne((r) => r.url === '/api/admin/users')
      .flush({ items: [me, { ...other, is_admin: true }], total_count: 2 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Назначить админом');
    fixture.destroy();
  });
  it('removes admin access after a server denial', async () => {
    const { fixture, component, http } = setup();
    const denied = vi.fn();
    component.accessDenied.subscribe(denied);
    (fixture.nativeElement.querySelector('.users .actions button') as HTMLButtonElement).click();
    component.confirm();
    http
      .expectOne('/api/admin/users/2/promote')
      .flush({ error: 'Нет доступа' }, { status: 403, statusText: 'Forbidden' });
    expect(denied).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(TestBed.inject(NgbModal).hasOpenModals()).toBe(false));
    fixture.destroy();
  });
  it('returns to the last remaining page after a concurrent deletion', () => {
    const { fixture, component, http } = setup();
    component.pageChanged(2);
    http.expectOne((r) => r.url === '/api/admin/users').flush({ items: [], total_count: 20 });
    const last = http.expectOne((r) => r.url === '/api/admin/users');
    expect(last.request.params.get('offset')).toBe('0');
    last.flush({ items: [me], total_count: 20 });
    expect(component.loading).toBe(false);
    fixture.destroy();
  });
});
