import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { FooterComponent } from './components/footer/footer.component';
import { Store } from '@ngxs/store';
import { PlatformsActions } from './states/platforms/states/platforms-actions';
import { Observable } from 'rxjs';
import { AuthState } from './states/auth/states/auth.state';
import { ChatComponent } from './components/chat/chat.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { ChatState } from './states/chat/states/chat.state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, ToastContainerComponent, FooterComponent, ChatComponent, AsyncPipe, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'game-stockx';

  public isChatVisible$!: Observable<boolean>;
  public isAuthorized$!: Observable<boolean>;

  constructor(private store: Store) {
  }

  public ngOnInit(): void {
    this.store.dispatch(new PlatformsActions.LoadPlaformsRequest());
    this.isChatVisible$ = this.store.select(ChatState.visible);
    this.isAuthorized$ = this.store.select(AuthState.isAuthorised);
  }
}
