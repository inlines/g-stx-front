import { UserBadgesService } from '@app/services/user-badges.service';
import { afterNextRender, DestroyRef, ElementRef, inject, NgZone, signal } from '@angular/core';
import { KudosComponent } from '../kudos/kudos.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthActions } from '@app/states/auth/states/auth-actions';
import { AuthState } from '@app/states/auth/states/auth.state';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { ChatState } from '@app/states/chat/states/chat.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [KudosComponent, UserAvatarComponent, RouterLink, AsyncPipe, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class HeaderComponent {
  readonly badges = inject(UserBadgesService);
  readonly navigationCollapsed = signal(false);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly store: Store,
    private router: Router,
  ) {
    afterNextRender(() => {
      const mobile = window.matchMedia('(max-width: 767px)');
      const update = () => {
        if (!mobile.matches || window.scrollY <= 1) {
          this.navigationCollapsed.set(false);
        } else if (!this.navigationCollapsed() && window.scrollY > 24) {
          const navigation = this.host.nativeElement.querySelector<HTMLElement>('.navigation-content');
          // Avoid collapsing a short page back to scrollY=0 and immediately reopening it.
          const remainingScroll = document.documentElement.scrollHeight - window.innerHeight - (navigation?.scrollHeight ?? 0);
          if (remainingScroll > 24) this.navigationCollapsed.set(true);
        }
      };
      const collapseForContent = () => {
        if (!mobile.matches) return;
        const navigation = this.host.nativeElement.querySelector<HTMLElement>('.navigation-collapse');
        if (!navigation) return;
        this.navigationCollapsed.set(true);
        // Finish the height change before the caller measures its scroll target.
        navigation.style.transition = 'none';
        navigation.classList.add('collapsed');
        navigation.setAttribute('inert', '');
        navigation.setAttribute('aria-hidden', 'true');
        navigation.getBoundingClientRect();
        navigation.style.removeProperty('transition');
      };
      this.zone.runOutsideAngular(() => {
        window.addEventListener('gstx:content-scroll', collapseForContent);
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
      });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('gstx:content-scroll', collapseForContent);
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      });
    });
    this.currentUser$ = this.store.select(AuthState.login);
    this.isAuthorised$ = this.store.select(AuthState.isAuthorised);
    this.unreadCount$ = this.store.select(ChatState.unreadCount);
    this.isConnected$ = this.store.select(ChatState.isConnected);
  }

  public readonly currentUser$: Observable<string | null>;
  public readonly isAuthorised$: Observable<boolean>;
  public readonly unreadCount$: Observable<number>;

  public readonly isConnected$: Observable<boolean>;

  public logout(): void {
    this.store.dispatch(new AuthActions.Logout());
  }

  public toggleChat(): void {
    this.store.dispatch(new ChatActions.ToggleChatVisibility());
  }
}
