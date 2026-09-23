import { UserBadgesService } from '@app/services/user-badges.service';
import { DestroyRef, ElementRef, HostListener, inject } from '@angular/core';
import { KudosComponent } from '../kudos/kudos.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { AuthActions } from '@app/states/auth/states/auth-actions';
import { AuthState } from '@app/states/auth/states/auth.state';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { ChatState } from '@app/states/chat/states/chat.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';
import { NavIconComponent } from './nav-icon.component';

@Component({
  selector: 'app-header',
  imports: [KudosComponent, UserAvatarComponent, RouterLink, AsyncPipe, RouterModule, NavIconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class HeaderComponent {
  readonly badges = inject(UserBadgesService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  @HostListener('document:click', ['$event'])
  closeOutside(event: MouseEvent) {
    for (const menu of this.host.nativeElement.querySelectorAll<HTMLDetailsElement>('details[open]')) {
      if (!menu.contains(event.target as Node)) menu.open = false;
    }
  }
  @HostListener('document:keydown.escape')
  onEscape() { this.closeMenus(true); }
  closeMenus(restoreFocus = false) {
    for (const menu of this.host.nativeElement.querySelectorAll<HTMLDetailsElement>('details[open]')) {
      menu.open = false;
      if (restoreFocus) menu.querySelector('summary')?.focus();
    }
  }
  constructor(
    private readonly store: Store,
    private router: Router,
  ) {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationEnd) this.closeMenus();
    });
    this.currentUser$ = this.store.select(AuthState.login);
    this.isAuthorised$ = this.store.select(AuthState.isAuthorised);
    this.unreadCount$ = this.store.select(ChatState.unreadCount);
    this.isChatVisible$ = this.store.select(ChatState.visible);
    this.isConnected$ = this.store.select(ChatState.isConnected);
  }

  public readonly currentUser$: Observable<string | null>;
  public readonly isAuthorised$: Observable<boolean>;
  public readonly unreadCount$: Observable<number>;

  public readonly isChatVisible$: Observable<boolean>;
  public readonly isConnected$: Observable<boolean>;

  resetCatalogFilters(): void {
    this.store.dispatch(new ProductsActions.SetRequestParams({ignore_digital:true, include_unreleased:false, offset:0}));
  }
  public logout(): void {
    this.store.dispatch(new AuthActions.Logout());
  }

  public toggleChat(): void {
    this.store.dispatch(new ChatActions.ToggleChatVisibility());
  }
}
