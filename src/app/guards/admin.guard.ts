import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '@app/services/admin.service';
import { catchError, map, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AdminService).me().pipe(
    map(user => user.is_admin || router.createUrlTree(['/products'])),
    catchError(() => of(router.createUrlTree(['/products']))),
  );
};
