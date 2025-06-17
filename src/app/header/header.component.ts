import { AsyncPipe, NgIf } from '@angular/common';
import { Component, } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthActions } from '@app/states/auth/states/auth-actions';
import { AuthState } from '@app/states/auth/states/auth.state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, AsyncPipe, NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true
})
export class HeaderComponent {
  constructor(
    private readonly store: Store
  ) {
    this.currentUser$ = this.store.select(AuthState.login);
  }

  public readonly currentUser$: Observable<string | null>;

  public logout(): void {
    this.store.dispatch(new AuthActions.Logout());
  }
}
