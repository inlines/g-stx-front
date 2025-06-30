import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { Store } from '@ngxs/store';
import { combineLatest, filter, map, Observable, Subject, Subscription, take, withLatestFrom } from 'rxjs';
import { PagerComponent } from '../pager/pager.component';
import { IPlatformItem } from '@app/states/platforms/interfaces/platform-item.interface';
import { PlatformState } from '@app/states/platforms/states/platforms.state';


const LIMIT = 18;
@Component({
  selector: 'app-collection',
  imports: [AsyncPipe, NgFor, RouterModule, NgIf, PagerComponent],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.scss',
  standalone: true,
})
export class CollectionComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  constructor(
    private readonly store: Store
  ){
    this.collection$ = this.store.select(CollectionState.loadedCollection);
    this.collectionParams$ = this.store.select(CollectionState.collectionParams);
    this.activePlatforms$ = this.store.select(OwnershipState.activeCollectionPlatforms);
    this.collectionTotalCount$ = this.store.select(CollectionState.totalCountCollection);
    this.displayCategories$ = combineLatest([
      this.activePlatforms$,
      this.store.select(PlatformState.loadedPlatforms)
    ]).pipe
     (
      map(([tupples, platforms]) => platforms.reduce(
        (acc: IPlatformItem[], item) => {
          const matchingTupple = tupples.find(t => t.platform === item.id);
          if(matchingTupple) {
            acc.push({
              ...item,
              user_games: matchingTupple.have_games
            })
          }
          return acc;
        },
        []
      ))
    );
  }

  public limit = LIMIT;

  private collectionParams$: Observable<IProductListRequest>;

  public activePlatforms$: Observable<any[]>;

  public displayCategories$: Observable<IPlatformItem[]>;

  public activeCategory$ = new Subject<number>;

  public activeCategory: number| null = null;

  public collection$: Observable<ICollectionItem[]>;

  public collectionTotalCount$: Observable<number>;

  public categories$!: Observable<IPlatformItem[]>;

  public ngOnInit(): void {
    const sub =  this.activeCategory$.subscribe(x => this.store.dispatch(new CollectionActions.SetCollectionParams({cat: x, limit: LIMIT, offset: 0,})));

    const paramsSub = this.collectionParams$.pipe(filter(x => !!x.cat && !!x.limit)).subscribe(params => this.store.dispatch(new CollectionActions.GetCollectionRequest()));

    this.subscriptions.push(sub, paramsSub);

    this.activePlatforms$.pipe(
      filter(platforms => platforms.length > 0),
      take(1)
    ).subscribe(platforms => {this.activeCategory$.next(platforms[0].platform); this.activeCategory = platforms[0].platform;})
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(x => x.unsubscribe());
  }
  
  public setActiveCategory(cat: number) {
    this.activeCategory$.next(cat);
    this.activeCategory = cat;
  }

  public remove(release_id: number, event: Event): void {
    this.store.dispatch(new CollectionActions.RemoveFromCollectionRequest({release_id}));
    event.stopImmediatePropagation();
  }

  public pageChanged(page: number): void {
    this.store.dispatch(new CollectionActions.SetCollectionParams({
      offset: (page - 1 ) * LIMIT
    }));
  }
}
 