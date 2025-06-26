import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { AuthState } from '@app/states/auth/states/auth.state';
import { IProductPropertiesResponse } from '@app/states/products/interfaces/product-properties-response.interface';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { IReleaseItem } from '@app/states/products/interfaces/release-item.interface';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';

@Component({
  selector: 'app-product-properties',
  imports: [AsyncPipe, NgIf, DatePipe, NgFor, NgbCarouselModule],
  templateUrl: './product-properties.component.html',
  styleUrl: './product-properties.component.scss',
  standalone: true,
})
export class ProductPropertiesComponent {
  constructor(
    private readonly store: Store
  ){
    this.productProperties$ = this.store.select(ProductsState.productProperties);
    this.isAuthorised$ = this.store.select(AuthState.isAuthorised);
    this.releases$ = this.productProperties$.pipe(
    switchMap(properties => {
      if (!properties) return of([]);
        const releaseStreams = properties.releases.map(release =>
          (
            combineLatest([
              this.store.select(OwnershipState.hasRelease(release.release_id)),
              this.store.select(OwnershipState.hasWish(release.release_id)),
            ])
          ).pipe(
            map(([owned, wished]) => ({
              ...release,
              owned,
              wished
            }))
          )
        );

        return releaseStreams.length > 0 ? combineLatest(releaseStreams) : of([]);
      })
    );

  }

  public productProperties$: Observable<IProductPropertiesResponse | null>;

  public isAuthorised$: Observable<boolean>;

  public releases$: Observable<IReleaseItem[]>;

  public addToCollection(release_id: number): void {
    this.store.dispatch(new CollectionActions.AddToCollectionRequest({release_id}))
  }

  public addWish(release_id: number): void {
    this.store.dispatch(new CollectionActions.AddWishRequest({release_id}))
  }
}
