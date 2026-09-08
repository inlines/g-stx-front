import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { AuthActions } from '@app/states/auth/states/auth-actions';
import { AuthState } from '@app/states/auth/states/auth.state';
import { Store } from '@ngxs/store';
import { catchError, throwError } from 'rxjs';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const store = inject(Store);
  const api = new URL(inject(ENVIRONMENT).apiUrl, window.location.href);
  const url = new URL(req.url, window.location.href);
  const apiPath = api.pathname.replace(/\/$/, '');
  const isApi =
    url.origin === api.origin && (url.pathname === apiPath || url.pathname.startsWith(`${apiPath}/`));
  const token = store.selectSnapshot(AuthState.token);
  const request = isApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // A late 401 from an old session must not log out a newly signed-in user.
      if (isApi && token && error.status === 401 && store.selectSnapshot(AuthState.token) === token) {
        store.dispatch(new AuthActions.Logout());
      }
      return throwError(() => error);
    }),
  );
}
