import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductPropertiesResolver implements Resolve<boolean> {
  constructor(private readonly store: Store) {}

  resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.store
      .dispatch(new ProductsActions.LoadProperties(route.paramMap.get('id') ?? ''))
      .pipe(map(() => this.store.selectSnapshot(ProductsState.productPropertiesLoaded)));
  }
}
