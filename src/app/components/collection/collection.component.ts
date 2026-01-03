import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { Store } from '@ngxs/store';
import { BehaviorSubject, combineLatest, filter, map, Observable, startWith, Subject, Subscription, switchMap, take, tap } from 'rxjs';
import { IPlatformItem } from '@app/states/platforms/interfaces/platform-item.interface';
import { PlatformState } from '@app/states/platforms/states/platforms.state';
import { ICollectionItemWithLetter } from '@app/states/collection/interfaces/collection-item-with-letter.interface';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';


const LIMIT = 1000;
@Component({
  selector: 'app-collection',
  imports: [AsyncPipe, RouterModule, FormsModule, ReactiveFormsModule, DatePipe, NgbDropdownModule, CurrencyPipe],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.scss',
  standalone: true,
})
export class CollectionComponent implements OnInit, OnDestroy {

  @ViewChild('priceModal', { static: true }) priceModalRef!: TemplateRef<any>;

  subscriptions: Subscription[] = [];
  constructor(
    private readonly store: Store,
    private readonly modalService: NgbModal,
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
              user_games: matchingTupple.have_games,
              total_spent: matchingTupple.total_spent
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

  public activeCategoryTotalSpent: number| null = null;

  public collection$: Observable<ICollectionItem[]>;

  public collectionWithLetters$!: Observable<ICollectionItemWithLetter[]>;

  public collectionTotalCount$: Observable<number>;

  public categories$!: Observable<IPlatformItem[]>;

  public priceControl: FormControl = new FormControl(0, [
    Validators.required,
    Validators.pattern(/^\d+$/),
    Validators.min(0)
  ]);

  public queryForm: FormGroup = new FormGroup({
      query: new FormControl('')
    });

  public ngOnInit(): void {
    let params = this.store.selectSnapshot(CollectionState.collectionParams);
    if(params.cat) {
      this.activeCategory$.next(params.cat);
      this.activeCategory = params.cat;
    }


    const sub =  this.activeCategory$.subscribe(x => this.store.dispatch(new CollectionActions.SetCollectionParams({cat: x, limit: LIMIT, offset: 0,})));

    const paramsSub = this.collectionParams$.pipe(filter(x => !!x.cat && !!x.limit)).subscribe(params => this.store.dispatch(new CollectionActions.GetCollectionRequest()));

    this.collectionWithLetters$ = 
      combineLatest([
        this.collection$,
        this.queryForm.valueChanges.pipe(startWith('')),
        this.sortBy$.asObservable()
      ]).pipe(
        map(([collection, form, sortBy]) => {
          // Сначала фильтруем
          const filtered = collection.filter(item => 
            !form.query || item.product_name.toLowerCase().includes(form.query.toLowerCase())
          );
          
          // Затем сортируем
          let sorted;
          if (sortBy === 'name') {
            sorted = filtered.sort((a, b) => 
              a.product_name.toLowerCase().localeCompare(b.product_name.toLowerCase())
            );
          } else if (sortBy === 'date') {
            sorted = filtered.sort((a, b) => {
              if (!a.release_date && !b.release_date) return 0;
              if (!a.release_date) return 1;
              if (!b.release_date) return -1;
              return a.release_date - b.release_date;
            });
          } else {
            sorted = filtered.sort((a, b) => {
              if (!a.price && !b.price) return 0;
              if (!b.price) return 1;
              if (!a.price) return -1;
              return a.price - b.price;
            });
          }
          
          // Теперь добавляем разделители
          const result: ICollectionItemWithLetter[] = [];
          let lastLetter: string | null = null;
          let lastYear: string | null = null;
          
          for (const item of sorted) {
            let letter: string | undefined;
            let release_year: string | undefined;
            
            if (sortBy === 'name') {
              const currentLetter = item.product_name.toLowerCase()[0];
              if (currentLetter !== lastLetter) {
                letter = currentLetter;
                lastLetter = currentLetter;
              }
            } else if (sortBy === 'date') {
              const getYearFromTimestamp = (timestamp: number | undefined): string => {
                if (!timestamp) return 'Unknown';
                if (timestamp < 10000000000) {
                  return new Date(timestamp * 1000).getFullYear().toString();
                } else {
                  return new Date(timestamp).getFullYear().toString();
                }
              };
              
              const currentYear = getYearFromTimestamp(item.release_date || 0);
              if (currentYear !== lastYear) {
                release_year = currentYear;
                lastYear = currentYear;
              }
            }
            
            result.push({
              item,
              letter,
              release_year
            });
          }
          
          return result;
        })
      );


    const subPlat = this.activePlatforms$.pipe(
      filter(platforms => platforms.length > 0),
    ).subscribe(platforms => {
      if(!this.activeCategory) {
        this.activeCategory$.next(platforms[0].platform);
        this.activeCategory = platforms[0].platform;
        this.activeCategorCount = platforms[0].have_games;
        this.activeCategoryTotalSpent = platforms[0].total_spent
      }
    });

    this.subscriptions.push(sub, paramsSub, subPlat);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(x => x.unsubscribe());
  }
  
  public setActiveCategory(cat: number, count: number | undefined, spent: number | undefined) {
    this.activeCategory$.next(cat);
    this.activeCategory = cat;
    this.activeCategorCount = count || null;
    this.activeCategoryTotalSpent = spent || null;
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
                this.setActiveCategory(nextCategory.id, nextCategory.user_games, nextCategory.total_spent);
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

  public setPriceProductName: string | null = null;
  public setPriceReleaseId: number | null = null;

  public setPrice(release_id: number, release_name: string, event: Event): void {
    event.stopImmediatePropagation();
    this.priceControl.setValue(0);
    this.setPriceProductName = release_name;
    this.setPriceReleaseId = release_id;
    this.modalService.open(this.priceModalRef, { centered: true });
  }

  public sendPrice(): void {
    if(this.setPriceReleaseId) {
      this.store.dispatch(new CollectionActions.SetPriceRequest({release_id: this.setPriceReleaseId, price: parseInt(this.priceControl.value)})).subscribe(() => {
        this.modalService.dismissAll();
        this.store.dispatch(
          new CollectionActions.GetCollectionRequest()
        );
      })
    }
  }

  public sortBy$: BehaviorSubject<'name' | 'date' | 'price'> = new BehaviorSubject<'name' | 'date' | 'price'>('name');

  setSort(mode: 'name' | 'date' | 'price') {
    this.sortBy$.next(mode);
  }
}
