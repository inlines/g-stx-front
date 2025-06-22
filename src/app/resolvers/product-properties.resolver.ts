import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductPropertiesResolver implements Resolve<boolean> {

  constructor(private readonly store: Store) {
  }

  resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
    const urlSegments = route.url;
    const lastSegment = urlSegments[urlSegments.length - 1]?.path;

    this.store.dispatch(new ProductsActions.LoadProperties(lastSegment));
    return(this.store.select(ProductsState.productPropertiesLoaded));
  }
}