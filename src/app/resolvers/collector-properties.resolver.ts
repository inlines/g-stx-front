import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { CollectorsActions } from '@app/states/collectors/states/collectors-actions';
import { CollectorsState } from '@app/states/collectors/states/collectors.state';
import { Store } from '@ngxs/store';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CollectorPropertiesResolver implements Resolve<boolean> {
  constructor(private readonly store: Store) {}

  resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.store
      .dispatch(new CollectorsActions.GetCollectorsPropertiesRequest(route.paramMap.get('id') ?? ''))
      .pipe(map(() => this.store.selectSnapshot(CollectorsState.collectorPropertiesLoaded)));
  }
}
