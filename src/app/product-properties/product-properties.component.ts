import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { IProductPropertiesResponse } from '@app/states/products/interfaces/product-properties-response.interface';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product-properties',
  imports: [AsyncPipe, NgIf, DatePipe, NgFor],
  templateUrl: './product-properties.component.html',
  styleUrl: './product-properties.component.scss',
  standalone: true,
})
export class ProductPropertiesComponent {
  constructor(
    private readonly store: Store
  ){
    this.productProperties$ = this.store.select(ProductsState.productProperties)
  }

  public productProperties$: Observable<IProductPropertiesResponse | null>;
}
