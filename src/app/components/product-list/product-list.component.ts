import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable, Subscription } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { PagerComponent } from '@app/components/pager/pager.component';


const LIMIT = 24;
@Component({
  selector: 'app-product-list',
  imports: [NgIf, NgFor, AsyncPipe, DatePipe, RouterModule, ReactiveFormsModule, PagerComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  standalone: true,
})
export class ProductListComponent implements OnInit, OnDestroy {
  constructor(private readonly store: Store){
    const params = this.store.selectSnapshot(ProductsState.productsParams);
    if(!params) {
      this.store.dispatch(new ProductsActions.SetRequestParams({
        limit: LIMIT,
        offset: 0,
        query: undefined,
        cat: 6
      }));
    }
    this.products$ = this.store.select(ProductsState.loadedProducts);
    this.productsTotalCount$ = this.store.select(ProductsState.totalCountProducts);
    this.productParams$ = this.store.select(ProductsState.productsParams);
    this.queryForm = new FormGroup({
      query: new FormControl(this.store.selectSnapshot(ProductsState.productsParams).query || '')
    });
    this.activeCategory = new BehaviorSubject(this.store.selectSnapshot(ProductsState.productsParams).cat || 6);    
    this.offset$ = this.store.select(ProductsState.productsParams).pipe(
      map(params => params?.offset || 0)
    )
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(x => x.unsubscribe());
  }

  public products$: Observable<IProductListItem[]>;

  public offset$: Observable<number>;

  public productsTotalCount$: Observable<number>;

  public productParams$: Observable<IProductListRequest>;

  public subscriptions: Subscription[] = [];

  public queryForm;

  public activeCategory;

  public limit = LIMIT;

  public categories = [
    { id: 6, label: 'PC' },
    { id: 38, label: 'PSP' },
    { id: 8, label: 'PS2' },
    { id: 9, label: 'PS3' },
    { id: 48, label: 'PS4' },
    { id: 167, label: 'PS5' }
  ];


  public setActiveCategory(cat: number) {
    this.activeCategory.next(cat);
  }

  public pageChanged(page: number): void {
    this.store.dispatch(new ProductsActions.SetRequestParams({
      offset: (page - 1 ) * LIMIT
    }));
  }

  public ngOnInit(): void {
    let lastCategory: number = this.activeCategory.value;

    const query$ = this.queryForm.controls.query.valueChanges.pipe(
      map(q => q?.trim() || null),
      debounceTime(500),
      distinctUntilChanged()
    );

    const category$ = this.activeCategory.asObservable().pipe(
      distinctUntilChanged()
    );

    // при изменении query
    const subQuery = query$.subscribe(query => {
      this.store.dispatch(new ProductsActions.SetRequestParams({
        query: query || undefined,
        offset: 0,
        limit: LIMIT,
        cat: lastCategory
      }));
    });

    // при изменении category
    const subCat = category$.subscribe(category => {
      lastCategory = category;
      if(this.store.selectSnapshot(ProductsState.productsParams).cat !== category) {
        this.queryForm.controls.query.setValue('');
        this.store.dispatch(new ProductsActions.SetRequestParams({
          query: undefined,
          offset: 0,
          limit: LIMIT,
          cat: category
        }));
      }
    });

    const sub2 = this.productParams$.pipe(
      distinctUntilChanged((prev, curr) => prev.limit === curr.limit && prev.offset === curr.offset && prev.query === curr.query && prev.cat === curr.cat)
    ).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.store.dispatch(new ProductsActions.LoadList());
    });

    this.subscriptions.push(
      subQuery, subCat, sub2
    );
  }

}
