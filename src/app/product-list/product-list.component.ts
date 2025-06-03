import { AsyncPipe, DatePipe, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product-list',
  imports: [NgFor, AsyncPipe, DatePipe, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  standalone: true,
})
export class ProductListComponent {
  constructor(private readonly store: Store){
    this.store.dispatch(new ProductsActions.SetRequestParams({
      limit: 102,
      offset: 0,
    })).subscribe(() => {
      this.store.dispatch(new ProductsActions.LoadList());
    })
    this.products$ = this.store.select(ProductsState.loadedProducts);
  }

  public products$: Observable<IProductListItem[]>;
}
