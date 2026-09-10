import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { catchError, Observable, of, shareReplay, switchMap, timer } from 'rxjs';
export interface KudosScore {
  user_login: string;
  kudos: number;
}
@Injectable({ providedIn: 'root' })
export class KudosService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ENVIRONMENT).apiUrl;
  private readonly scores = new Map<string, Observable<KudosScore | null>>();
  score(login: string) {
    let score = this.scores.get(login);
    if (!score) {
      score = timer(0, 60_000).pipe(
        switchMap(() =>
          this.http
            .get<KudosScore>(`${this.api}/kudos`, { params: { login } })
            .pipe(catchError(() => of(null))),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      this.scores.set(login, score);
    }
    return score;
  }
  challenge() {
    return this.http.get<KudosScore[]>(`${this.api}/kudos/challenge`);
  }
}
