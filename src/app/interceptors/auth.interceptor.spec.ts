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
