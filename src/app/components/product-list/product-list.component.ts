import { RegionFiltersComponent } from '../region-filters/region-filters.component';
import { normalizeRegions, platformRegionCounts, RegionGroup, toggleRegion } from '@app/shared/region-filter';
import { GameStatsComponent } from '../game-stats/game-stats.component';
import { supportsReleaseActions } from '@app/shared/release-platforms';
import { AsyncPipe, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  Input,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PagerComponent } from '@app/components/pager/pager.component';
import { CATALOG_PAGE_SIZE, catalogParams, sameListParams } from '@app/shared/list-params';
import { AuthState } from '@app/states/auth/states/auth.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { PlatformState } from '@app/states/platforms/states/platforms.state';
import { ProductSort } from '@app/states/products/interfaces/product-list-request.interface';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { combineLatest, debounceTime, distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-product-list',
  imports: [RegionFiltersComponent, GameStatsComponent, AsyncPipe, DatePipe, RouterModule, ReactiveFormsModule, PagerComponent],
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit, AfterViewInit {
  @Input() unknown = false;
  @Input() franchiseId?: number;
  @Input() companyId?: number;
  @Input() companyRole?: 'developer' | 'publisher';
  @Input() platformIds: number[] | null = null;
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('query') query?: ElementRef<HTMLInputElement>;

  readonly limit = CATALOG_PAGE_SIZE;
  readonly productParams$ = this.store.select(ProductsState.productsParams);
  readonly offset$ = this.productParams$.pipe(map((params) => params.offset ?? 0));
  readonly categories$ = this.store
    .select(PlatformState.loadedPlatforms)
    .pipe(
      map((platforms) =>
        platforms.filter((p) => p.id !== 6 && (this.platformIds === null || this.platformIds.includes(p.id))),
      ),
    );
  readonly selectedRegionCounts$ = combineLatest([this.categories$, this.productParams$]).pipe(map(([platforms, params]) => platformRegionCounts(platforms.find((p) => p.id === params.cat))));
  get selectedRegions() { return normalizeRegions(this.queryForm.controls.regions.value); }
  toggleRegion(region: RegionGroup): void {
    this.queryForm.controls.regions.setValue(toggleRegion(this.selectedRegions, region).join(','));
    this.updateFilters();
  }
  readonly productsTotalCount$ = this.store.select(ProductsState.totalCountProducts);
  readonly isAuthorised$ = this.store.select(AuthState.isAuthorised);
  readonly loading$ = this.store.select(ProductsState.listLoading);
  readonly failed$ = this.store.select(ProductsState.listFailed);
  readonly products$ = combineLatest([
    this.store.select(ProductsState.loadedProducts),
    this.store.select(OwnershipState.ownership),
    this.productParams$,
  ]).pipe(
    map(([products, ownership, params]) => {
      const owned = new Set(
        ownership.filter((item) => item.platform === params.cat).flatMap((item) => item.have_prod_ids ?? []),
      );
      return products.map((product) => ({ ...product, owned: owned.has(product.id) }));
    }),
  );
  readonly queryForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
    sort: new FormControl<ProductSort>('date', { nonNullable: true }),
    localMultiplayer: new FormControl(false, { nonNullable: true }),
    onlineMultiplayer: new FormControl(false, { nonNullable: true }),
    includeUnreleased: new FormControl(false, { nonNullable: true }),
    regions: new FormControl('', { nonNullable: true }),
    skipDigitalFilter: new FormControl(true, { nonNullable: true }),
  });
  activeCategory = 48;
  readonly supportsReleaseActions = supportsReleaseActions;

  ngOnInit(): void {
    const saved = this.store.selectSnapshot(ProductsState.productsParams);
    const sameCatalogContext =
      (saved.unknown ?? false) === this.unknown &&
      saved.franchise_id === this.franchiseId &&
      saved.company_id === this.companyId &&
      saved.company_role === this.companyRole;
    const availableIds = this.platformIds?.filter((id) => id !== 6);
    const preferred = saved.cat && saved.cat !== 6 ? saved.cat : 48;
    const cat = availableIds?.length && !availableIds.includes(preferred) ? availableIds[0] : preferred;
    const params = catalogParams({
      ...saved,
      cat,
      ...(cat !== saved.cat ? { offset: 0 } : {}),
      unknown: this.unknown,
      franchise_id: this.franchiseId,
      company_id: this.companyId,
      company_role: this.companyRole,
      ...(sameCatalogContext
        ? {}
        : {
            offset: 0,
            query: '',
            sort: 'date',
            ignore_digital: true,
            include_unreleased: false,
            regions: '',
            local_multiplayer: false,
            online_multiplayer: false,
          }),
    });
    this.activeCategory = params.cat!;
    this.queryForm.setValue(
      {
        query: params.query ?? '',
        sort: params.sort!,
        includeUnreleased: params.include_unreleased ?? false,
        regions: params.regions ?? '',
        skipDigitalFilter: params.ignore_digital!,
        localMultiplayer: params.local_multiplayer ?? false,
        onlineMultiplayer: params.online_multiplayer ?? false,
      },
      { emitEvent: false },
    );
    this.store.dispatch(
      new ProductsActions.SetRequestParams({
        ...params,
        unknown: this.unknown,
      franchise_id: this.franchiseId,
        company_id: this.companyId,
        company_role: this.companyRole,
        query: params.query,
      }),
    );

    this.queryForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFilters());
    this.productParams$
      .pipe(distinctUntilChanged(sameListParams), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.store.dispatch(new ProductsActions.LoadList());
      });
  }

  ngAfterViewInit(): void {
    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) this.query?.nativeElement.focus();
  }

  private updateFilters(): void {
    const { query, sort, skipDigitalFilter, localMultiplayer, onlineMultiplayer, includeUnreleased, regions } =
      this.queryForm.getRawValue();
    const current = this.store.selectSnapshot(ProductsState.productsParams);
    const next = catalogParams({
      ...current,
      query,
      sort,
      cat: this.activeCategory,
      ignore_digital: skipDigitalFilter,
      include_unreleased: includeUnreleased,
      regions,
      local_multiplayer: localMultiplayer,
      online_multiplayer: onlineMultiplayer,
    });
    if (!sameListParams(current, next)) {
      this.store.dispatch(new ProductsActions.SetRequestParams({ ...next, query: next.query, offset: 0 }));
    }
  }

  setActiveCategory(cat: number): void {
    if (cat === 6 || cat === this.activeCategory) return;
    this.activeCategory = cat;
    // Emit to cancel any pending debounced search from the previous platform.
    this.queryForm.patchValue({ query: '', sort: 'date' });
    this.updateFilters();
    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) this.query?.nativeElement.focus();
  }

  pageChanged(page: number): void {
    this.store.dispatch(new ProductsActions.SetRequestParams({ offset: (page - 1) * this.limit }));
  }
}
