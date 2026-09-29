import { Router } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthState } from '@app/states/auth/states/auth.state';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { Store } from '@ngxs/store';
import { authInterceptor } from './auth.interceptor';

describe('API authorization boundary', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let store: Store;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...TEST_PROVIDERS,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    store = TestBed.inject(Store);
    store.reset({
      ...store.snapshot(),
      Auth: { ...store.snapshot().Auth, token: 'current', login: 'alice' },
    });
  });
  afterEach(() => http.verify());
  it('redirects an anonymous catalogue 401 to login', () => {
    store.reset({ ...store.snapshot(), Auth: { ...store.snapshot().Auth, token: null, login: null } });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    client.get('/api/products?cat=9&limit=20&offset=40').subscribe({ error: () => {} });
    http.expectOne('/api/products?cat=9&limit=20&offset=40').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
  it('does not redirect on failed credentials or external 401', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    for (const url of ['/api/login', '/api/register', 'https://external.invalid/api']) {
      client.post(url, {}).subscribe({ error: () => {} });
      http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    }
    expect(navigate).not.toHaveBeenCalled();
    expect(store.selectSnapshot(AuthState.token)).toBe('current');
  });
  it('does not redirect a newly authenticated user after a late guest 401', () => {
    store.reset({ ...store.snapshot(), Auth: { ...store.snapshot().Auth, token: null } });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    client.get('/api/collection').subscribe({ error: () => {} });
    store.reset({ ...store.snapshot(), Auth: { ...store.snapshot().Auth, token: 'new' } });
    http.expectOne('/api/collection').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).not.toHaveBeenCalled();
  });
  it('attaches the token only to API requests', () => {
    for (const url of ['/api/collection', '/api-other/data', 'https://external.invalid/api/data']) {
      client.get(url).subscribe();
      const req = http.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe(
        url === '/api/collection' ? 'Bearer current' : null,
      );
      req.flush({});
    }
  });
  it('does not log out a new session on an old request failure', () => {
    client.get('/api/collection').subscribe({ error: () => {} });
    const req = http.expectOne('/api/collection');
    store.reset({ ...store.snapshot(), Auth: { ...store.snapshot().Auth, token: 'new-token' } });
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.selectSnapshot(AuthState.token)).toBe('new-token');
  });
});
