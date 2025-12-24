import { AsyncPipe } from '@angular/common';
import { Component, } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterModule } from '@angular/router';
import { AuthActions } from '@app/states/auth/states/auth-actions';
import { AuthState } from '@app/states/auth/states/auth.state';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { ChatState } from '@app/states/chat/states/chat.state';
import { Store } from '@ngxs/store';
import { distinctUntilChanged, filter, map, Observable } from 'rxjs';
import { Location } from '@angular/common';
@Component({
  selector: 'app-header',
  imports: [RouterLink, AsyncPipe, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true
})
export class HeaderComponent {
  constructor(
    private readonly store: Store,
    private router: Router,
    private location: Location
  ) {
    this.currentUser$ = this.store.select(AuthState.login);
    this.isAuthorised$ = this.store.select(AuthState.isAuthorised);
    this.showChatWarning$ = this.store.select(ChatState.showWarning);
    this.isConnected$ = this.store.select(ChatState.isConnected);
    this.showBackButton$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => /^\/products\/\d+/.test(this.router.url)), // Регулярка для `/products/186066`
      distinctUntilChanged()
    );
  }

  public readonly currentUser$: Observable<string | null>;
  public readonly isAuthorised$: Observable<boolean>;
  public readonly showChatWarning$!: Observable<boolean>;
  public readonly showBackButton$!: Observable<boolean>;

  public readonly isConnected$: Observable<boolean>;

  public logout(): void {
    this.store.dispatch(new AuthActions.Logout());
  }

  public toggleChat(): void {
    this.store.dispatch(new ChatActions.ToggleChatVisibility());
  }

  public goBack() {
    this.location.back();
  }
}
