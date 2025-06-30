import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthState } from '@app/states/auth/states/auth.state';
import { Store } from '@ngxs/store';
import { map, tap } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(AuthState.isAuthorised).pipe(
    tap(isAuth => {
      if (!isAuth) {
        router.navigate(['/login']);
      }
    }),
    map(isAuth => isAuth));
};
