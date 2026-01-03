import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { Store } from '@ngxs/store';
import { combineLatest, filter, Observable, Subject, Subscription, switchMap, take, tap } from 'rxjs';

const LIMIT = 1000;
@Component({
  selector: 'app-wishlist',
  imports: [AsyncPipe, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
  standalone: true,
})
export class WishlistComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  constructor(
    private readonly store: Store
  ){
    this.collection$ = this.store.select(CollectionState.loadedWishlist);
    this.wishlistParams$ = this.store.select(CollectionState.wishlistParams);
    this.activePlatforms$ = this.store.select(OwnershipState.activeWishlistPlatforms);
    this.wishlistTotalCount$ = this.store.select(CollectionState.totalCountWishlist);
  }

  public limit = LIMIT;

  private wishlistParams$: Observable<IProductListRequest>;

  public activePlatforms$: Observable<number[]>;

  public wishlistTotalCount$: Observable<number>;

  public ngOnInit(): void {

    let params = this.store.selectSnapshot(CollectionState.wishlistParams);
    if(params.cat) {
      this.activeCategory$.next(params.cat);
      this.activeCategory = params.cat;
    }

    const sub =  this.activeCategory$.subscribe(x => this.store.dispatch(new CollectionActions.SetWishlistParams({cat: x, limit: LIMIT, offset: 0,})));

    const paramsSub = this.wishlistParams$.pipe(filter(x => !!x.cat)).subscribe(params => this.store.dispatch(new CollectionActions.GetWishlistRequest()));

    this.subscriptions.push(sub, paramsSub);

    this.activePlatforms$.pipe(
      filter(platforms => platforms.length > 0),
      take(1)
    ).subscribe(platforms => {
      if(!this.activeCategory) {
        this.activeCategory$.next(platforms[0]); this.activeCategory = platforms[0];
      }
    })
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(x => x.unsubscribe());
  }

  public activeCategory$ = new Subject<number>;

  public activeCategory: number| null = null;
  
  public setActiveCategory(cat: number) {
    this.activeCategory$.next(cat);
    this.activeCategory = cat;
  }

  public collection$: Observable<ICollectionItem[]>;

  public remove(release_id: number, event: Event): void {
    event.stopImmediatePropagation();
    combineLatest([
      this.collection$,
      this.activePlatforms$
    ]).pipe(
      take(1),
      switchMap(([collection, platformIds]) => {
        const removeAction$ = this.store.dispatch(
          new CollectionActions.RemoveWishRequest({ release_id })
        );

        if (collection.length > 1) {
          return removeAction$.pipe(
            tap(() => this.store.dispatch(
              new CollectionActions.GetWishlistRequest()
            ))
          );
        } else {
          return removeAction$.pipe(
            tap(() => {
              const nextCategory = platformIds.find(id => id !== this.activeCategory);
              if (nextCategory) {
                this.setActiveCategory(nextCategory);
              } else {
                this.store.dispatch(new CollectionActions.GetWishlistRequest());
              }
            })
          );
        }
      })
    ).subscribe();
  }
}
 