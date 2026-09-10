import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { catchError, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserBadgesService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ENVIRONMENT).apiUrl;
  private readonly changed = new Subject<void>();
  // All avatars share one request; no additional request per chat or collector.
  readonly admins$ = this.changed.pipe(
    startWith(undefined),
    switchMap(() =>
      this.http.get<string[]>(`${this.api}/users/admin-badges`).pipe(catchError(() => of([] as string[]))),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  refresh() {
    this.changed.next();
  }
}
