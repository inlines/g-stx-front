import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ENVIRONMENT } from '@app/environments/environment.token';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { ProductListComponent } from '../product-list/product-list.component';
interface Franchise {
  id: number;
  name: string;
  platform_ids: number[];
}
@Component({
  selector: 'app-franchise',
  imports: [AsyncPipe, RouterLink, ProductListComponent],
  templateUrl: './franchise.component.html',
  styleUrl: './franchise.component.scss',
})
export class FranchiseComponent {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly reload = new BehaviorSubject(0);
  readonly vm$ = combineLatest([
    this.route.paramMap.pipe(
      map((p) => p.get('id')),
      distinctUntilChanged(),
    ),
    this.reload,
  ]).pipe(
    switchMap(([id]) =>
      this.http.get<Franchise>(`${this.environment.apiUrl}/franchises/${encodeURIComponent(id ?? '')}`).pipe(
        map((franchise) => ({ franchise, loading: false, status: 0 })),
        startWith({ franchise: null, loading: true, status: 0 }),
        catchError((error) => of({ franchise: null, loading: false, status: error.status as number })),
      ),
    ),
  );
  retry(): void {
    this.reload.next(this.reload.value + 1);
  }
}
