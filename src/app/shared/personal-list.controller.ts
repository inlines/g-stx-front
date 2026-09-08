import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RequestStatus } from '@app/constants/request-status.const';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { IPlatformItem } from '@app/states/platforms/interfaces/platform-item.interface';
import { PlatformState } from '@app/states/platforms/states/platforms.state';
import { Store } from '@ngxs/store';
import { combineLatest, distinctUntilChanged, filter, map, Observable, shareReplay } from 'rxjs';
import { normalizeListParams, PERSONAL_LIST_PAGE_SIZE, sameListParams } from './list-params';

const LISTS = {
  collection: {
    items: CollectionState.loadedCollection,
    params: CollectionState.collectionParams,
    set: CollectionActions.SetCollectionParams,
    load: CollectionActions.GetCollectionRequest,
  },
  wishlist: {
    items: CollectionState.loadedWishlist,
    params: CollectionState.wishlistParams,
    set: CollectionActions.SetWishlistParams,
    load: CollectionActions.GetWishlistRequest,
  },
  wts: {
    items: CollectionState.loadedWts,
    params: CollectionState.wtsParams,
    set: CollectionActions.SetWtstParams,
    load: CollectionActions.GetWtsRequest,
  },
};

/** Component-scoped lifecycle for personal lists; public API/state names stay unchanged. */
@Injectable()
export class PersonalListController {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private config: (typeof LISTS)[keyof typeof LISTS] = LISTS.collection;
  items$!: Observable<ICollectionItem[]>;
  platforms$!: Observable<IPlatformItem[]>;
  activeCategory: number | null = null;
  totalSpent = 0;

  connect(kind: keyof typeof LISTS): void {
    this.config = LISTS[kind];
    this.items$ = this.store
      .select(this.config.items)
      .pipe(map((items) => items.map((item) => ({ ...item }))));
    this.platforms$ = combineLatest([
      this.store.select(OwnershipState.ownership),
      this.store.select(PlatformState.loadedPlatforms),
    ]).pipe(
      map(([ownership, platforms]) =>
        platforms.flatMap((platform) => {
          const item = ownership.find((entry) => entry.platform === platform.id);
          if (!item) return [];
          // Older API responses have no WTS statistics. Preserve the existing fallback.
          const count =
            kind === 'wishlist'
              ? item.wish_count
              : kind === 'wts'
                ? (item.wts_count ?? item.have_count)
                : item.have_count;
          return count > 0
            ? [
                {
                  ...platform,
                  user_games: new Set(item.have_prod_ids ?? []).size,
                  total_spent: item.total_spent,
                },
              ]
            : [];
        }),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    const saved = this.store.selectSnapshot(this.config.params);
    this.activeCategory = saved.cat ?? null;
    this.store.dispatch(
      new this.config.set(normalizeListParams({ ...saved, limit: PERSONAL_LIST_PAGE_SIZE, offset: 0 })),
    );
    this.store
      .select(this.config.params)
      .pipe(
        filter((params) => !!params.cat),
        distinctUntilChanged(sameListParams),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((params) => {
        this.activeCategory = params.cat!;
        this.store.dispatch(new this.config.load());
      });
    this.platforms$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((platforms) => {
      if (platforms.length && !platforms.some((platform) => platform.id === this.activeCategory))
        this.select(platforms[0].id);
      this.totalSpent = platforms.find((platform) => platform.id === this.activeCategory)?.total_spent ?? 0;
    });
  }

  select(cat: number): void {
    if (cat === this.activeCategory) return;
    this.activeCategory = cat;
    this.store.dispatch(new this.config.set({ cat, limit: PERSONAL_LIST_PAGE_SIZE, offset: 0 }));
    this.totalSpent =
      this.store.selectSnapshot(OwnershipState.ownership).find((item) => item.platform === cat)
        ?.total_spent ?? 0;
  }

  mutate(action: object, onSuccess?: () => void): void {
    const previousCategory = this.activeCategory;
    this.store
      .dispatch(action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.store.selectSnapshot(CollectionState.changeStatus) !== RequestStatus.Load) return;
        if (this.activeCategory === previousCategory && this.activeCategory)
          this.store.dispatch(new this.config.load());
        onSuccess?.();
      });
  }
}
