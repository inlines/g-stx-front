import { AsyncPipe, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-collection',
  imports: [AsyncPipe, NgFor],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.scss',
  standalone: true,
})
export class CollectionComponent {
  constructor(
    private readonly store: Store
  ){
    this.collection$ = this.store.select(CollectionState.loadedCollection);
  }

  public collection$: Observable<ICollectionItem[]>;

  public remove(release_id: number): void {
    
  }
}
 