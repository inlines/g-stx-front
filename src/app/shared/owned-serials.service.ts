import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AuthState } from '@app/states/auth/states/auth.state';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionService } from '@app/states/collection/services/collection.service';
import { canonicalSerial, displaySerials } from './serial-number';

export function copySerials(item: {selected_serial?: string | null; serial: string[]}): string[] {
  if (item.selected_serial) return [canonicalSerial(item.selected_serial)];
  const serials = displaySerials(item.serial);
  // An unspecified copy with multiple editions does not identify any one serial.
  return serials.length === 1 ? serials : [];
}

@Injectable({providedIn: 'root'})
export class OwnedSerialsService {
  private readonly store = inject(Store);
  private readonly service = inject(CollectionService);
  private readonly actions = inject(Actions);
  readonly copies = toSignal(this.store.select(AuthState.login).pipe(
    switchMap(login => !login ? of([]) : this.actions.pipe(
      ofActionSuccessful(CollectionActions.AddToCollectionSuccess, CollectionActions.RemoveFromCollectionSuccess, CollectionActions.SetCopySuccess),
      startWith(null),
      switchMap(() => this.service.getCompleteCollection({cat: 0, include_unreleased: true, ignore_digital: false}).pipe(
        map(response => response.items),
        catchError(() => of([])),
      )),
      startWith([]),
    )),
  ), {initialValue: []});

  hasUnspecifiedCopy(releaseId: number): boolean {
    return this.copies().some(item => item.release_id === releaseId && !item.selected_serial && copySerials(item).length === 0);
  }

  forGame(productId: number, platform?: number | null): string[] {
    return this.copies().filter(item => item.product_id === productId && (!platform || item.platform_id === platform))
      .flatMap(copySerials);
  }
}
