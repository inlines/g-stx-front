import { afterNextRender, DestroyRef, inject, Injectable, Injector } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Save before route teardown; restore only after the returning list has rendered its data. */
@Injectable({ providedIn: 'root' })
export class ListScrollService {
  private readonly router = inject(Router);
  private readonly positions = new Map<number, number>();
  private entry = this.router.getCurrentNavigation()?.id ?? history.state?.navigationId ?? 0;
  private active: object | null = null;
  private pending: number | undefined;
  private navigationVersion = 0;

  constructor() {
    // Native restoration runs before asynchronously loaded grids regain their height.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.navigationVersion++;
        if (this.active) this.positions.set(this.entry, window.scrollY);
        this.pending = event.restoredState
          ? this.positions.get(event.restoredState.navigationId) : undefined;
      } else if (event instanceof NavigationEnd) {
        this.entry = event.id;
      }
    });
  }

  attach(destroyRef: DestroyRef, injector: Injector): () => boolean {
    const token = {};
    this.active = token;
    let position = this.pending;
    this.pending = undefined;
    destroyRef.onDestroy(() => {
      if (this.active === token) this.active = null;
    });
    return () => {
      if (position === undefined) return false;
      const top = position;
      const navigationVersion = this.navigationVersion;
      position = undefined;
      afterNextRender(() => {
        if (!destroyRef.destroyed && this.active === token && navigationVersion === this.navigationVersion)
          window.scrollTo({ top, behavior: 'instant' });
      }, { injector });
      return true;
    };
  }
}
