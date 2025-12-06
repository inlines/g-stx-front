import { AsyncPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectorsState } from '@app/states/collectors/states/collectors.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-collector-properties',
  imports: [RouterModule, DatePipe, AsyncPipe],
  templateUrl: './collector-properties.component.html',
  styleUrl: './collector-properties.component.scss'
})
export class CollectorPropertiesComponent {
  public loadedCollection$: Observable<ICollectionItem[]>;
  public collectionPropertiesLogin$: Observable<string>;

  constructor(
    private readonly store: Store
  ){
    this.loadedCollection$ = this.store.select(CollectorsState.loadedCollection);
    this.collectionPropertiesLogin$ = this.store.select(CollectorsState.collectionPropertiesLogin);
  }

  public startChatWith(): void {
    const user = this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin);
    if(user) {
      this.store.dispatch(new ChatActions.SetRecepient(user));
      this.store.dispatch(new ChatActions.RequestMessages(user));
      this.store.dispatch(new ChatActions.ToggleChatVisibility());
    }
  }
}
