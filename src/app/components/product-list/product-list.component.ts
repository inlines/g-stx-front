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
  imports: [AsyncPipe, DatePipe, RouterModule, ReactiveFormsModule, PagerComponent],
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit, AfterViewInit {
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
        this.platformIds === null ? platforms : platforms.filter((p) => this.platformIds!.includes(p.id)),
      ),
    );
  readonly productsTotalCount$ = this.store.select(ProductsState.totalCountProducts);
  readonly isAuthorised$ = this.store.select(AuthState.isAuthorised);
  readonly loading$ = this.store.select(ProductsState.listLoading);
  readonly failed$ = this.store.select(ProductsState.listFailed);
  readonly products$ = combineLatest([
    this.store.select(ProductsState.loadedProducts),
    this.store.select(OwnershipState.ownership),
  ]).pipe(
    map(([products, ownership]) => {
      const owned = new Set(ownership.flatMap((item) => item.have_prod_ids ?? []));
      return products.map((product) => ({ ...product, owned: owned.has(product.id) }));
    }),
  );
  readonly queryForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
    sort: new FormControl<ProductSort>('date', { nonNullable: true }),
    skipDigitalFilter: new FormControl(true, { nonNullable: true }),
  });
  activeCategory = 6;

  ngOnInit(): void {
    const saved = this.store.selectSnapshot(ProductsState.productsParams);
    const sameCatalogContext =
      saved.franchise_id === this.franchiseId &&
      saved.company_id === this.companyId &&
      saved.company_role === this.companyRole;
    const cat =
      this.platformIds && !this.platformIds.includes(saved.cat ?? 6) ? this.platformIds[0] : saved.cat;
    const params = catalogParams({
      ...saved,
      cat,
      franchise_id: this.franchiseId,
      company_id: this.companyId,
      company_role: this.companyRole,
      ...(sameCatalogContext ? {} : { offset: 0, query: '', sort: 'date', ignore_digital: true }),
    });
    this.activeCategory = params.cat!;
    this.queryForm.setValue(
      { query: params.query ?? '', sort: params.sort!, skipDigitalFilter: params.ignore_digital! },
      { emitEvent: false },
    );
    this.store.dispatch(
      new ProductsActions.SetRequestParams({
        ...params,
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
    const { query, sort, skipDigitalFilter } = this.queryForm.getRawValue();
    const current = this.store.selectSnapshot(ProductsState.productsParams);
    const next = catalogParams({
      ...current,
      query,
      sort,
      cat: this.activeCategory,
      ignore_digital: skipDigitalFilter,
    });
    if (!sameListParams(current, next)) {
      this.store.dispatch(new ProductsActions.SetRequestParams({ ...next, query: next.query, offset: 0 }));
    }
  }

  setActiveCategory(cat: number): void {
    if (cat === this.activeCategory) return;
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
