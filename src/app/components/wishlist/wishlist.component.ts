import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { Store } from '@ngxs/store';
import { filter, Observable, Subject, Subscription, take } from 'rxjs';
import { PagerComponent } from '@app/components/pager/pager.component';

const LIMIT = 18;
@Component({
  selector: 'app-wishlist',
  imports: [AsyncPipe, NgFor, RouterModule, NgIf, PagerComponent],
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
    this.collectionParams$ = this.store.select(CollectionState.wishlistParams);
    this.activePlatforms$ = this.store.select(OwnershipState.activeWishlistPlatforms);
    this.wishlistTotalCount$ = this.store.select(CollectionState.totalCountWishlist);
  }

  public limit = LIMIT;

  private collectionParams$: Observable<IProductListRequest>;

  public activePlatforms$: Observable<number[]>;

  public wishlistTotalCount$: Observable<number>;

  public ngOnInit(): void {
    const sub =  this.activeCategory$.subscribe(x => this.store.dispatch(new CollectionActions.SetWishlistParams({cat: x, limit: LIMIT, offset: 0,})));

    const paramsSub = this.collectionParams$.pipe(filter(x => !!x.cat)).subscribe(params => this.store.dispatch(new CollectionActions.GetWishlistRequest()));

    this.subscriptions.push(sub, paramsSub);

    this.activePlatforms$.pipe(
      filter(platforms => platforms.length > 0),
      take(1)
    ).subscribe(platforms => {this.activeCategory$.next(platforms[0]); this.activeCategory = platforms[0];})
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
     this.store.dispatch(new CollectionActions.RemoveWishRequest({release_id}));
     event.stopImmediatePropagation();
  }

  public pageChanged(page: number): void {
    this.store.dispatch(new CollectionActions.SetWishlistParams({
      offset: (page - 1 ) * LIMIT
    }));
  }
}
 