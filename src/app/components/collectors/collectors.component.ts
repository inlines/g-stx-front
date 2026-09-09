import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { ChatService } from '@app/states/chat/services/chat.service';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ICollectorItem } from '@app/states/collectors/interfaces/collector-item.interface';
import { CollectorsActions } from '@app/states/collectors/states/collectors-actions';
import { CollectorsState } from '@app/states/collectors/states/collectors.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-collectors',
  imports: [UserAvatarComponent, AsyncPipe, RouterModule],
  templateUrl: './collectors.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './collectors.component.scss',
})
export class CollectorsComponent implements OnInit {
  readonly online$ = inject(ChatService).online$;

  constructor(private readonly store: Store) {
    this.collectors$ = this.store.select(CollectorsState.collectors);
  }

  public ngOnInit(): void {
    this.store.dispatch(new CollectorsActions.GetCollectorsRequest());
  }

  public collectors$: Observable<ICollectorItem[]>;
}
