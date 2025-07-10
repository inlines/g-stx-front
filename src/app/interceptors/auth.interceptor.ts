import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthActions } from "@app/states/auth/states/auth-actions";
import { AuthState } from "@app/states/auth/states/auth.state";
import { Store } from "@ngxs/store";
import { catchError, throwError } from "rxjs";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const store = inject(Store);
  const router = inject(Router);
  const token = store.selectSnapshot(AuthState.token);

  const clonedReq = token
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      })
    : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        store.dispatch(new AuthActions.Logout());
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
