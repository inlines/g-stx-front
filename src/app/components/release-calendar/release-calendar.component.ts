import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ListScrollService } from '@app/shared/list-scroll.service';
import { CalendarViewService } from './calendar-view.service';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  Injector,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { PageSwipeDirective } from '@app/directives/page-swipe.directive';
import { calendarDays, CalendarResponse, CalendarDay, CalendarGame } from './calendar-model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-release-calendar',
  imports: [RouterLink, PageSwipeDirective, CdkTrapFocus],
  templateUrl: './release-calendar.component.html',
  styleUrl: './release-calendar.component.scss',
})
export class ReleaseCalendarComponent {
  private router = inject(Router);
  private http = inject(HttpClient);
  private env = inject(ENVIRONMENT);
  private destroy = inject(DestroyRef);
  private view = inject(CalendarViewService);
  private restoreScroll = inject(ListScrollService).attach(this.destroy, inject(Injector));
  data: CalendarResponse | null = null;
  loading = false;
  failed = false;
  month = 0;
  platform: number | null = this.view.platform;
  open: CalendarDay | null = null;
  left = 0;
  top = 0;
  mobile = false;
  private closeTimer?: ReturnType<typeof setTimeout>;
  readonly weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  readonly today = new Date().toISOString().slice(0, 10);
  constructor() {
    this.load();
    this.destroy.onDestroy(() => {
      this.keepOpen();
    });
  }
  load() {
    this.loading = true;
    this.failed = false;
    this.http
      .get<CalendarResponse>(`${this.env.apiUrl}/release-calendar`)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (data) => {
          this.data = data;
          if (this.view.month) {
            const [year, month] = this.view.month.split('-').map(Number);
            const [baseYear, baseMonth] = data.start.split('-').map(Number);
            this.month = Math.max(0, Math.min(2, (year - baseYear) * 12 + month - baseMonth));
          }
          this.saveView();
          this.loading = false;
          this.restoreScroll();
        },
        error: () => {
          this.loading = false;
          this.failed = true;
        },
      });
  }
  get days() {
    return this.data ? calendarDays(this.data.start, this.month, this.data.items, this.platform) : [];
  }
  monthName(offset: number) {
    if (!this.data) return '';
    const [y, m] = this.data.start.split('-').map(Number);
    return new Intl.DateTimeFormat('ru', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(y, m - 1 + offset, 1)),
    );
  }
  get count() {
    return this.days.reduce((n, d) => n + (d?.games.length ?? 0), 0);
  }
  stepMonth(delta: number) {
    const next = this.month + delta;
    if (next < 0 || next > 2) return;
    this.chooseMonth(next);
  }
  private saveView() {
    this.view.platform = this.platform;
    if (this.data) {
      const [year, month] = this.data.start.split('-').map(Number);
      this.view.month = new Date(Date.UTC(year, month - 1 + this.month, 1)).toISOString().slice(0, 10);
    }
  }
  chooseMonth(n: number) {
    this.month = n;
    this.saveView();
    this.close();
  }
  choosePlatform(n: number | null) {
    this.platform = n;
    this.saveView();
    this.close();
  }
  show(day: CalendarDay, el: HTMLElement) {
    if (day.games.length < 2) return;
    this.keepOpen();
    this.open = day;
    this.mobile = window.matchMedia('(max-width:767px)').matches;
    const r = el.getBoundingClientRect();
    this.left = Math.max(12, Math.min(r.left, window.innerWidth - 340));
    this.top = Math.max(12, Math.min(r.bottom + 6, window.innerHeight - 350));
  }
  hover(day: CalendarDay, el: HTMLElement) {
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) this.show(day, el);
  }
  keepOpen() {
    clearTimeout(this.closeTimer);
  }
  leave() {
    if (this.mobile) return;
    this.keepOpen();
    this.closeTimer = setTimeout(() => this.close(), 180);
  }
  close() {
    this.keepOpen();
    this.open = null;
  }
  tapDay(day: CalendarDay, el: HTMLElement) {
    if (window.matchMedia('(max-width:767px)').matches && day.games.length > 1) this.show(day, el);
  }
  gameLink(game: CalendarGame) {
    return this.router.serializeUrl(
      this.router.createUrlTree(['/products', game.id, { platform: game.platform }]),
    );
  }
  go(e: MouseEvent, game: CalendarGame, day?: CalendarDay, el?: HTMLElement) {
    if (day && el && day.games.length > 1 && window.matchMedia('(max-width:767px)').matches) {
      e.preventDefault();
      e.stopPropagation();
      this.show(day, el);
      return;
    }
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.router.navigateByUrl(this.gameLink(game));
    }
  }
  @HostListener('document:keydown.escape') escape() {
    this.close();
  }
  @HostListener('window:resize') resize() {
    this.close();
  }
  @HostListener('window:scroll') scroll() {
    if (!this.mobile) this.close();
  }
}
