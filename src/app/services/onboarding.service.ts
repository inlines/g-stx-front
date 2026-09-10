import { OnboardingSound } from './onboarding-sound';
import { take } from 'rxjs';
import { DestroyRef, Injectable, Injector, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Actions, Store, ofActionDispatched, ofActionSuccessful } from '@ngxs/store';
import { AuthActions } from '@app/states/auth/states/auth-actions';
import { AuthState } from '@app/states/auth/states/auth.state';

/** A login counter, not a page-view counter. Session restoration never triggers it. */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly actions = inject(Actions);
  private readonly store = inject(Store);
  private readonly injector = inject(Injector);
  private readonly destroy = inject(DestroyRef);
  private readonly counts = new Map<string, number>();
  private readonly sound = new OnboardingSound();
  private started = false;
  private generation = 0;
  private dialog?: NgbModalRef;

  start() {
    if (this.started) return;
    this.started = true;
    this.actions
      .pipe(ofActionSuccessful(AuthActions.LoginRequestSuccess), takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        void this.onLogin();
      });
    this.actions
      .pipe(
        ofActionDispatched(AuthActions.Logout, AuthActions.LoginRequest),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((action: AuthActions.LoginRequest | AuthActions.Logout) => {
        this.cancel();
        if (action instanceof AuthActions.LoginRequest && this.loginCount(action.payload.user_login) < 5)
          this.sound.prepare();
      });
    this.actions
      .pipe(ofActionSuccessful(AuthActions.LoginRequestFail), takeUntilDestroyed(this.destroy))
      .subscribe(() => this.sound.stop());
    this.destroy.onDestroy(() => this.cancel());
  }

  private cancel() {
    this.generation++;
    const dialog = this.dialog;
    this.dialog = undefined;
    dialog?.close();
    this.sound.stop();
  }

  private loginCount(login: string): number {
    const key = `gstx:onboarding:logins:${encodeURIComponent(login)}`;
    let count = this.counts.get(key) ?? 0;
    try {
      const stored = Number(localStorage.getItem(key));
      if (Number.isSafeInteger(stored) && stored >= 0) count = Math.max(count, stored);
    } catch {
      /* Private browsing can deny storage; retain a session counter. */
    }
    return count;
  }

  private recordLogin(login: string): boolean {
    const key = `gstx:onboarding:logins:${encodeURIComponent(login)}`;
    const count = Math.min(this.loginCount(login) + 1, 6);
    this.counts.set(key, count);
    try {
      localStorage.setItem(key, String(count));
    } catch {
      /* The login still succeeds. */
    }
    return count <= 5;
  }

  private async onLogin() {
    const login = this.store.selectSnapshot(AuthState.login);
    const token = this.store.selectSnapshot(AuthState.token);
    if (!login || !token || !this.recordLogin(login)) {
      this.sound.stop();
      return;
    }
    const generation = ++this.generation;
    try {
      const { openOnboarding } = await import('../components/onboarding/onboarding-launcher');
      if (generation !== this.generation || this.store.selectSnapshot(AuthState.token) !== token) return;
      this.dialog?.close();
      const dialog = openOnboarding(this.injector);
      this.dialog = dialog;
      dialog.shown?.pipe(take(1)).subscribe(() => {
        if (this.dialog === dialog) this.sound.play();
      });
      const clear = () => {
        if (this.dialog === dialog) {
          this.dialog = undefined;
          this.sound.stop();
        }
      };
      dialog.result.then(clear, clear);
    } catch {
      this.sound.stop();
      /* A failed optional chunk must never block login. */
    }
  }
}
