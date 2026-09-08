import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthState } from '@app/states/auth/states/auth.state';
import { Store } from '@ngxs/store';

export const authGuard: CanActivateFn = () =>
  inject(Store).selectSnapshot(AuthState.isAuthorised) || inject(Router).createUrlTree(['/login']);
