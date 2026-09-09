import { priceValidator } from '@app/shared/price-validator';
import { libraryCsv, LibraryCsvDownload } from '@app/shared/library-csv';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, combineLatest, map, shareReplay, tap } from 'rxjs';
import { RequestStatus } from '@app/constants/request-status.const';
import { filterCollection, CollectionSort } from '@app/shared/collection-filter';
import { LibraryKind, LibraryView, LibraryViewService } from '@app/shared/library-view.service';
import { PersonalListController } from '@app/shared/personal-list.controller';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { ReleaseCardComponent } from '../release-card/release-card.component';
import { buildPages } from '../pager/pagination';
@Component({
  selector: 'app-personal-library',
  imports: [AsyncPipe, CurrencyPipe, ReactiveFormsModule, RouterLink, ReleaseCardComponent],
  providers: [PersonalListController],
  templateUrl: './personal-library.component.html',
  styleUrl: './personal-library.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PersonalLibraryComponent implements OnInit, OnDestroy {
  @Input({ required: true }) kind!: LibraryKind;
  @ViewChild('priceModal', { static: true }) priceModal!: TemplateRef<unknown>;
  @ViewChild('saleModal', { static: true }) saleModal!: TemplateRef<unknown>;
  readonly salePrice = new FormControl<number | null>(null, {
    validators: [priceValidator],
  });
  readonly saleCib = new FormControl(false, { nonNullable: true });
  sellingItem: ICollectionItem | null = null;
  readonly list = inject(PersonalListController);
  private readonly csvDownload = inject(LibraryCsvDownload);
  private readonly store = inject(Store);
  private readonly views = inject(LibraryViewService);
  private readonly modal = inject(NgbModal);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly changes = new BehaviorSubject<void>(undefined);
  view!: LibraryView;
  readonly query = new FormControl('', { nonNullable: true });
  readonly price = new FormControl(0, {
    nonNullable: true,
    validators: [Validators.required, priceValidator],
  });
  readonly busy$ = this.store.select(CollectionState.collectionChanging);
  editing: ICollectionItem | null = null;
  vm$!: ReturnType<PersonalLibraryComponent['createView']>;
  private restoring = true;
  ngOnInit(): void {
    this.view = this.views.get(this.kind);
    this.query.setValue(this.view.query, { emitEvent: false });
    this.list.connect(this.kind);
    this.vm$ = this.createView();
    this.query.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((query) => {
      this.view.query = query;
      this.view.page = 1;
      this.changes.next();
    });
  }
  private createView() {
    return combineLatest([
      this.list.items$,
      this.store.select(CollectionState.libraryStatuses),
      this.store.select(OwnershipState.ownership),
      this.changes,
    ]).pipe(
      map(([items, statuses, ownership]) => {
        const status = statuses[this.kind];
        const filtered =
          this.kind === 'collection' ? filterCollection(items, this.view.query, this.view.sort) : items;
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / this.view.size));
        // Do not discard the saved page while a fresh list is loading.
        if (status === RequestStatus.Load) this.view.page = Math.min(this.view.page, pages);
        const start = (this.view.page - 1) * this.view.size;
        return {
          exportCount: items.length,
          forSale: new Set(ownership.flatMap((item) => item.wts_ids ?? [])),
          items: filtered.slice(start, start + this.view.size),
          total,
          start,
          pages,
          page: this.view.page,
          pageItems: buildPages(pages, this.view.page, 1),
          loading: status === RequestStatus.Pending,
          failed: status === RequestStatus.Error,
          ready: status === RequestStatus.Load,
        };
      }),
      tap((vm) => {
        if (this.restoring && vm.ready) {
          this.restoring = false;
          const scroll = this.view.scroll;
          afterNextRender(() => window.scrollTo({ top: scroll }), { injector: this.injector });
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
  exportCsv(): void {
    if (this.store.selectSnapshot(CollectionState.libraryStatuses)[this.kind] !== RequestStatus.Load) return;
    const items = this.store.selectSnapshot(
      this.kind === 'collection'
        ? CollectionState.loadedCollection
        : this.kind === 'wts'
          ? CollectionState.loadedWts
          : CollectionState.loadedWishlist,
    );
    if (!items.length) return;
    const selling = new Set(
      this.store.selectSnapshot(OwnershipState.ownership).flatMap((item) => item.wts_ids ?? []),
    );
    const ordered = this.kind === 'collection' ? filterCollection(items, '', this.view.sort) : items;
    this.csvDownload.save(
      libraryCsv(ordered, this.kind, selling),
      `${this.kind}-${this.list.activeCategory ?? 'all'}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }
  selectPlatform(cat: number): void {
    if (cat === this.list.activeCategory) return;
    this.view.page = 1;
    this.view.scroll = 0;
    this.list.select(cat);
    this.changes.next();
  }
  sort(value: string): void {
    this.view.sort = value as CollectionSort;
    this.view.page = 1;
    this.changes.next();
  }
  pageSize(value: string): void {
    this.view.size = Number(value);
    this.view.page = 1;
    this.changes.next();
  }
  page(value: number | string): void {
    if (typeof value !== 'number') return;
    this.view.page = value;
    this.changes.next();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  retry(): void {
    this.store.dispatch(
      this.kind === 'collection'
        ? new CollectionActions.GetCollectionRequest()
        : this.kind === 'wts'
          ? new CollectionActions.GetWtsRequest()
          : new CollectionActions.GetWishlistRequest(),
    );
  }
  remove(id: number): void {
    this.list.mutate(
      this.kind === 'collection'
        ? new CollectionActions.RemoveFromCollectionRequest({ release_id: id })
        : this.kind === 'wts'
          ? new CollectionActions.RemoveWtsRequest({ release_id: id })
          : new CollectionActions.RemoveWishRequest({ release_id: id }),
    );
  }
  toggleSale(item: ICollectionItem): void {
    if (this.kind !== 'collection' || this.store.selectSnapshot(CollectionState.collectionChanging)) return;
    const owned = this.store.selectSnapshot(OwnershipState.ownership);
    if (!owned.some((platform) => platform.have_ids.includes(item.release_id))) return;
    const selling = owned.some((platform) => (platform.wts_ids ?? []).includes(item.release_id));
    if (selling) {
      this.list.mutate(new CollectionActions.RemoveWtsRequest({ release_id: item.release_id }));
    } else {
      this.editSale(item);
    }
  }
  editSale(item: ICollectionItem): void {
    this.sellingItem = item;
    this.salePrice.reset(this.kind === 'wts' ? item.price : null);
    this.saleCib.reset(this.kind === 'wts' ? (item.cib ?? false) : false);
    this.modal.open(this.saleModal, { centered: true, ariaLabelledBy: 'library-sale-title' });
  }
  saveSale(): void {
    if (
      !this.sellingItem ||
      this.salePrice.invalid ||
      this.store.selectSnapshot(CollectionState.collectionChanging)
    )
      return;
    this.list.mutate(
      new CollectionActions.AddWtsRequest({
        release_id: this.sellingItem.release_id,
        price: this.salePrice.value,
        cib: this.saleCib.value,
      }),
      () => this.modal.dismissAll(),
    );
  }

  edit(item: ICollectionItem): void {
    this.editing = item;
    this.price.setValue(item.price ?? 0);
    this.modal.open(this.priceModal, { centered: true, ariaLabelledBy: 'library-price-title' });
  }
  savePrice(): void {
    if (!this.editing || this.price.invalid || this.store.selectSnapshot(CollectionState.collectionChanging))
      return;
    this.list.mutate(
      new CollectionActions.SetPriceRequest({
        release_id: this.editing.release_id,
        price: Number(this.price.value),
      }),
      () => this.modal.dismissAll(),
    );
  }
  ngOnDestroy(): void {
    if (this.view) this.view.scroll = window.scrollY;
    this.modal.dismissAll();
  }
}
