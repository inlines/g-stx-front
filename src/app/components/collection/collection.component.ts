import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { Store } from '@ngxs/store';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, Observable, of, startWith, Subject, Subscription, switchMap, take, tap } from 'rxjs';
import { PagerComponent } from '../pager/pager.component';
import { IPlatformItem } from '@app/states/platforms/interfaces/platform-item.interface';
import { PlatformState } from '@app/states/platforms/states/platforms.state';
import { ICollectionItemWithLetter } from '@app/states/collection/interfaces/collection-item-with-letter.interface';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';


const LIMIT = 1000;
@Component({
  selector: 'app-collection',
  imports: [AsyncPipe, RouterModule, PagerComponent, ReactiveFormsModule, DatePipe, NgbDropdownModule],
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

  public activeCategorCount: number| null = null;

  public collection$: Observable<ICollectionItem[]>;

  public collectionWithLetters$!: Observable<ICollectionItemWithLetter[]>;

  public collectionTotalCount$: Observable<number>;

  public categories$!: Observable<IPlatformItem[]>;

  public queryForm: FormGroup = new FormGroup({
      query: new FormControl('')
    });

  public ngOnInit(): void {
    const sub =  this.activeCategory$.subscribe(x => this.store.dispatch(new CollectionActions.SetCollectionParams({cat: x, limit: LIMIT, offset: 0,})));

    const paramsSub = this.collectionParams$.pipe(filter(x => !!x.cat && !!x.limit)).subscribe(params => this.store.dispatch(new CollectionActions.GetCollectionRequest()));

    this.collectionWithLetters$ = 
    combineLatest(
      [
        this.collection$,
        this.queryForm.valueChanges.pipe(startWith(''), debounceTime(1000)),
        this.sortBy$.asObservable()
      ]
    )
    .pipe(
      take(10),
      map(([collection, form, sortBy]) => collection.reduce((acc: ICollectionItemWithLetter[], val: ICollectionItem) => {
        const accLength = acc.length;
        const lastLetter = accLength >=1 ? acc[accLength - 1].letter || acc[accLength - 1].item.product_name.toLowerCase()[0] : null;
        if(!form.query || val.product_name.toLowerCase().includes(form.query.toLowerCase())) {
          acc.push(
            {
              item: val,
              letter: sortBy === 'name' ? val.product_name.toLowerCase()[0] !== lastLetter ? val.product_name.toLowerCase()[0] : undefined : undefined
            });
        }
        return sortBy === 'name' ? acc : acc.sort((a, b) => {
          if (!a.item.release_date && !b.item.release_date) return 0;
          if (!a.item.release_date) return 1;  // null в конце
          if (!b.item.release_date) return -1;
          return a.item.release_date - b.item.release_date;
        });
      }, []))
    )

    this.subscriptions.push(sub, paramsSub);

    this.activePlatforms$.pipe(
      filter(platforms => platforms.length > 0),
      take(1)
    ).subscribe(platforms => {this.activeCategory$.next(platforms[0].platform); this.activeCategory = platforms[0].platform; this.activeCategorCount = platforms[0].have_games})

    
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(x => x.unsubscribe());
  }
  
  public setActiveCategory(cat: number, count: number | undefined) {
    this.activeCategory$.next(cat);
    this.activeCategory = cat;
    this.activeCategorCount = count || null;
  }

  public remove(release_id: number, event: Event): void {
    event.stopImmediatePropagation();
    combineLatest([
      this.collection$,
      this.displayCategories$
    ]).pipe(
      take(1),
      switchMap(([collection, categories]) => {
        const removeAction$ = this.store.dispatch(
          new CollectionActions.RemoveFromCollectionRequest({ release_id })
        );

        if (collection.length > 1) {
          return removeAction$.pipe(
            tap(() => this.store.dispatch(
              new CollectionActions.GetCollectionRequest()
            ))
          );
        } else {
          return removeAction$.pipe(
            tap(() => {
              const nextCategory = categories.find(cat => cat.id !== this.activeCategory);
              if (nextCategory) {
                this.setActiveCategory(nextCategory.id, nextCategory.user_games);
              } else {
                this.store.dispatch(
                  new CollectionActions.GetCollectionRequest()
                );
              }
            })
          );
        }
      })
    ).subscribe();
  }

  public pageChanged(page: number): void {
    this.store.dispatch(new CollectionActions.SetCollectionParams({
      offset: (page - 1 ) * LIMIT
    }));
  }

  public sortBy$: BehaviorSubject<'name' | 'date'> = new BehaviorSubject<'name' | 'date'>('name');

  setSort(mode: 'name' | 'date') {
    this.sortBy$.next(mode);
  }
}
