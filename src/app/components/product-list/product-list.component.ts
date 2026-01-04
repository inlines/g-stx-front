import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { max, startWith, switchMap, takeUntil, throttleTime } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable, Subscription, fromEvent, combineLatest } from 'rxjs';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { PagerComponent } from '@app/components/pager/pager.component';
import { IPlatformItem } from '@app/states/platforms/interfaces/platform-item.interface';
import { PlatformState } from '@app/states/platforms/states/platforms.state';
import { AuthState } from '@app/states/auth/states/auth.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';

const LIMIT = 15;

@Component({
  selector: 'app-product-list',
  imports: [AsyncPipe, DatePipe, RouterModule, ReactiveFormsModule, PagerComponent, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  standalone: true,
})
export class ProductListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('stickerContent') stickerContent!: ElementRef;
  @ViewChild('query') query!: ElementRef;

  private lastScrollTop = 0;
  private isHidden = false;

  constructor(private readonly store: Store) {}

  public products$!: Observable<any[]>;
  public offset$!: Observable<number>;
  public productsTotalCount$!: Observable<number>;
  public productParams$!: Observable<IProductListRequest>;
  public queryForm!: FormGroup;
  public activeCategory!: BehaviorSubject<number>;
  public subscriptions: Subscription[] = [];
  public limit = LIMIT;
  public categories$!: Observable<IPlatformItem[]>;
  public skipDigitalFilter: boolean = false;
  public isAuthorised$!: Observable<boolean>;


  public ngOnInit(): void {
    let params = this.store.selectSnapshot(ProductsState.productsParams);
    if (!params) {
      this.store.dispatch(new ProductsActions.SetRequestParams({
        limit: LIMIT,
        offset: 0,
        query: undefined,
        cat: 6,
        ignore_digital: true,
        sort: 'name'
      }));
    }

    this.products$ = this.store.select(ProductsState.loadedProducts).pipe(
      map(products => products.map(x => ({...x, owned: this.store.selectSnapshot(OwnershipState.hasGame(x.id))})))
    );

    this.productsTotalCount$ = this.store.select(ProductsState.totalCountProducts);
    this.productParams$ = this.store.select(ProductsState.productsParams);
    this.categories$ = this.store.select(PlatformState.loadedPlatforms);
    this.queryForm = new FormGroup({
      query: new FormControl(params?.query || ''),
      sort: new FormControl(params?.sort || 'name'),
      franschise: new FormControl(params?.franschise || null),
      developer: new FormControl(params?.developer || null),
      publisher: new FormControl(params?.publisher || null),
      skipDigitalFilter: new FormControl(params.ignore_digital),
    });
    this.activeCategory = new BehaviorSubject<number>(params?.cat || 6);
    this.offset$ = this.productParams$.pipe(map(p => p?.offset || 0));
    this.isAuthorised$ = this.store.select(AuthState.isAuthorised);

    let lastCategory = this.activeCategory.value;

    const query$ = this.queryForm.controls['query'].valueChanges.pipe(
      map(q => q?.trim() || null),
      debounceTime(500),
      startWith(this.queryForm.controls['query'].value),
      distinctUntilChanged()
    );

    const sort$ = this.queryForm.controls['sort'].valueChanges.pipe(
      startWith(this.queryForm.controls['sort'].value),
      distinctUntilChanged()
    );

    const ignore_digital$ = this.queryForm.controls['skipDigitalFilter'].valueChanges.pipe(
      startWith(this.queryForm.controls['skipDigitalFilter'].value),
      distinctUntilChanged()
    );

    const category$ = this.activeCategory.asObservable().pipe(
      distinctUntilChanged()
    );

    let firstTime = true;
    const subQuery = combineLatest([query$, sort$, ignore_digital$]).pipe(
      distinctUntilChanged((prev, curr) =>
        prev[0] === curr[0] &&
        prev[1] === curr[1] &&
        prev[2] === curr[2]
      ))
      .subscribe(([query, sort, ignore_digital]) => {
        this.store.dispatch(new ProductsActions.SetRequestParams({
          query: query || undefined,
          offset: firstTime ? this.store.selectSnapshot(ProductsState.productsParams)?.offset || 0 : 0,
          limit: LIMIT,
          cat: lastCategory,
          ignore_digital: ignore_digital,
          sort,
        }));

        firstTime = false;
      });

    const subCat = category$.subscribe(category => {
      lastCategory = category;
      if (this.store.selectSnapshot(ProductsState.productsParams)?.cat !== category) {
        this.queryForm.controls['query'].setValue('');
        this.queryForm.controls['sort'].setValue('name');
        this.store.dispatch(new ProductsActions.SetRequestParams({
          query: undefined,
          offset: 0,
          limit: LIMIT,
          cat: category,
          sort: 'name'
        }));
      }
    });

    const subParams = this.productParams$.pipe(
      distinctUntilChanged((prev, curr) =>
        prev.limit === curr.limit &&
        prev.offset === curr.offset &&
        prev.query === curr.query &&
        prev.cat === curr.cat &&
        prev.ignore_digital === curr.ignore_digital &&
        prev.sort === curr.sort &&
        prev.ignore_digital === curr.ignore_digital
      )
    ).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.store.dispatch(new ProductsActions.LoadList());
    });

    this.subscriptions.push(subQuery, subCat, subParams);
  }

  public ngAfterViewInit(): void {
    if (window.innerWidth <= 576) {
      this.subscriptions.push(
      fromEvent(window, 'scroll')
        .pipe(
          throttleTime(100)
        )
        .subscribe(() => this.handleScroll())
      );
    }

    this.query.nativeElement.focus();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  public setActiveCategory(cat: number): void {
    this.store.dispatch(new ProductsActions.SetRequestParams({
      offset: 0,
    }));
    this.activeCategory.next(cat);
    this.query.nativeElement.focus();
  }

  public pageChanged(page: number): void {
    this.store.dispatch(new ProductsActions.SetRequestParams({
      offset: (page - 1) * LIMIT
    }));
  }
  
  public onDigitalFilterChange(): void {
    this.store.dispatch(new ProductsActions.SetRequestParams({
        limit: LIMIT,
        offset: 0,
        ignore_digital: this.skipDigitalFilter
    }));
  }

  private handleScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const goingDown = currentScroll > this.lastScrollTop;
    const stickerTop = this.stickerContent.nativeElement.getBoundingClientRect().top;
    const threshold = 81;

    if (goingDown && stickerTop <= threshold && !this.isHidden) {
      this.stickerContent.nativeElement.classList.add('hidden');
      this.isHidden = true;
    }

    if (!goingDown && this.isHidden && stickerTop > threshold + 5) {
      this.stickerContent.nativeElement.classList.remove('hidden');
      this.isHidden = false;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }
}
