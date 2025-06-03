import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { debounceTime, distinctUntilChanged, map, Observable, startWith, Subscription } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';


const LIMIT = 102;
@Component({
  selector: 'app-product-list',
  imports: [NgIf, NgFor, AsyncPipe, DatePipe, RouterModule, ReactiveFormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  standalone: true,
})
export class ProductListComponent implements OnInit, OnDestroy {
  constructor(private readonly store: Store){
    this.store.dispatch(new ProductsActions.SetRequestParams({
      limit: LIMIT,
      offset: 0,
      query: undefined
    }));
    this.products$ = this.store.select(ProductsState.loadedProducts);
    this.productParams$ = this.store.select(ProductsState.productsParams);
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(x => x.unsubscribe());
  }

  public products$: Observable<IProductListItem[]>;

  public productParams$: Observable<IProductListRequest>;

  public subscriptions: Subscription[] = [];

  public queryForm = new FormGroup({
    query: new FormControl('')
  });

  public ngOnInit(): void {
    const sub = this.queryForm.controls.query.valueChanges.pipe(
        map(query => query?.trim() || null),
        distinctUntilChanged(),
        debounceTime(1000),
      ).subscribe(query => {
        this.store.dispatch(new ProductsActions.SetRequestParams({
          query: query? query : undefined,
          offset: 0,
          limit: LIMIT
        }))
      });
    this.subscriptions.push(
      sub
    );

    this.productParams$.pipe(
      distinctUntilChanged((prev, curr) => prev.limit === curr.limit && prev.offset === curr.offset && prev.query === curr.query)
    ).subscribe(params => {
      this.store.dispatch(new ProductsActions.LoadList());
    });
  }

}
