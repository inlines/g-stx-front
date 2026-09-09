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
interface CatalogGroup {
  id: number;
  name: string;
  platform_ids?: number[];
  developer_platform_ids?: number[];
  publisher_platform_ids?: number[];
}
@Component({
  selector: 'app-catalog-group',
  imports: [AsyncPipe, RouterLink, ProductListComponent],
  templateUrl: './catalog-group.component.html',
  styleUrl: './catalog-group.component.scss',
})
export class CatalogGroupComponent {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly route = inject(ActivatedRoute);
  readonly isCompany = this.route.snapshot?.data?.['catalogKind'] === 'company';
  role: 'developer' | 'publisher' = 'developer';
  platforms(group: CatalogGroup): number[] {
    return this.isCompany
      ? this.role === 'developer'
        ? (group.developer_platform_ids ?? [])
        : (group.publisher_platform_ids ?? [])
      : (group.platform_ids ?? []);
  }
  private readonly reload = new BehaviorSubject(0);
  readonly vm$ = combineLatest([
    this.route.paramMap.pipe(
      map((p) => p.get('id')),
      distinctUntilChanged(),
    ),
    this.reload,
  ]).pipe(
    switchMap(([id]) =>
      this.http
        .get<CatalogGroup>(
          `${this.environment.apiUrl}/${this.isCompany ? 'companies' : 'franchises'}/${encodeURIComponent(id ?? '')}`,
        )
        .pipe(
          map((group) => ({ group, loading: false, status: 0 })),
          startWith({ group: null, loading: true, status: 0 }),
          catchError((error) => of({ group: null, loading: false, status: error.status as number })),
        ),
    ),
  );
  retry(): void {
    this.reload.next(this.reload.value + 1);
  }
}
