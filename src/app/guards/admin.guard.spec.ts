import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AdminService } from '@app/services/admin.service';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { adminGuard } from './admin.guard';

describe('Admin route access', () => {
  const redirect = {} as UrlTree;
  const me = vi.fn();
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    { provide: AdminService, useValue: { me } },
    { provide: Router, useValue: { createUrlTree: () => redirect } },
  ] }));
  async function check() {
    return firstValueFrom(TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never)) as Observable<boolean | UrlTree>);
  }
  it('allows only a role confirmed by the API', async () => {
    me.mockReturnValue(of({ is_admin: true }));
    expect(await check()).toBe(true);
    me.mockReturnValue(of({ is_admin: false }));
    expect(await check()).toBe(redirect);
    me.mockReturnValue(throwError(() => new Error('Unauthorized')));
    expect(await check()).toBe(redirect);
  });
});
