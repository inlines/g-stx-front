import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { calendarDays, CalendarResponse, CalendarDay, CalendarGame } from './calendar-model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-release-calendar',
  imports: [RouterLink],
  templateUrl: './release-calendar.component.html',
  styleUrl: './release-calendar.component.scss',
})
export class ReleaseCalendarComponent {
  private router = inject(Router);
  private http = inject(HttpClient);
  private env = inject(ENVIRONMENT);
  private destroy = inject(DestroyRef);
  data: CalendarResponse | null = null;
  loading = false;
  failed = false;
  month = 0;
  platform: number | null = null;
  open: CalendarDay | null = null;
  left = 0;
  top = 0;
  mobile = false;
  private hold?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private origin = { x: 0, y: 0 };
  private suppressClick = false;
  readonly weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  readonly today = new Date().toISOString().slice(0, 10);
  constructor() {
    this.load();
    this.destroy.onDestroy(() => {
      this.cancelHold();
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
          this.loading = false;
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
  chooseMonth(n: number) {
    this.month = n;
    this.close();
  }
  choosePlatform(n: number | null) {
    this.platform = n;
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
  press(e: PointerEvent, day: CalendarDay, el: HTMLElement) {
    this.cancelHold();
    this.suppressClick = false;
    if (e.pointerType === 'mouse' || day.games.length < 2) return;
    this.origin = { x: e.clientX, y: e.clientY };
    this.hold = setTimeout(() => {
      this.suppressClick = true;
      this.show(day, el);
    }, 500);
  }
  move(e: PointerEvent) {
    if (Math.hypot(e.clientX - this.origin.x, e.clientY - this.origin.y) > 10) this.cancelHold();
  }
  cancelHold() {
    clearTimeout(this.hold);
  }
  gameLink(game: CalendarGame) {
    return this.router.serializeUrl(
      this.router.createUrlTree(['/products', game.id, { platform: game.platform }]),
    );
  }
  go(e: MouseEvent, game: CalendarGame) {
    if (this.suppressClick) {
      e.preventDefault();
      this.suppressClick = false;
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
