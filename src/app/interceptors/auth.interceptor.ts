import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthState } from "@app/states/auth/states/auth.state";
import { Store } from "@ngxs/store";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const store = inject(Store);
  const token = store.selectSnapshot(AuthState.token);
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  return next(req);
}