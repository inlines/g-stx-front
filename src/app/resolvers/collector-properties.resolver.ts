import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { CollectorsActions } from '@app/states/collectors/states/collectors-actions';
import { CollectorsState } from '@app/states/collectors/states/collectors.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollectorPropertiesResolver implements Resolve<boolean> {

  constructor(private readonly store: Store) {
  }

  resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
    const urlSegments = route.url;
    const lastSegment = urlSegments[urlSegments.length - 1]?.path;

    this.store.dispatch(new CollectorsActions.GetCollectorsPropertiesRequest(lastSegment));
    return(this.store.select(CollectorsState.collectorPropertiesLoaded));
  }
}