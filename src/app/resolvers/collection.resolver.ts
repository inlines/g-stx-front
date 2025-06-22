import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollectionResolver implements Resolve<boolean> {

  constructor(private readonly store: Store) {
  }

  resolve(): boolean {
    this.store.dispatch(new CollectionActions.GetCollectionRequest());
    return true;
  }
}