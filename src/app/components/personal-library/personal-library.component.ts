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
  readonly list = inject(PersonalListController);
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
    validators: [
      Validators.required,
      Validators.min(0),
      Validators.max(2147483647),
      Validators.pattern(/^\d+$/),
    ],
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
      this.changes,
    ]).pipe(
      map(([items, statuses]) => {
        const status = statuses[this.kind];
        const filtered =
          this.kind === 'collection' ? filterCollection(items, this.view.query, this.view.sort) : items;
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / this.view.size));
        // Do not discard the saved page while a fresh list is loading.
        if (status === RequestStatus.Load) this.view.page = Math.min(this.view.page, pages);
        const start = (this.view.page - 1) * this.view.size;
        return {
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
        : new CollectionActions.GetWishlistRequest(),
    );
  }
  remove(id: number): void {
    this.list.mutate(
      this.kind === 'collection'
        ? new CollectionActions.RemoveFromCollectionRequest({ release_id: id })
        : new CollectionActions.RemoveWishRequest({ release_id: id }),
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
