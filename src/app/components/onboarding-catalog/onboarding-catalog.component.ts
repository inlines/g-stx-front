import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { PageSwipeDirective } from '@app/directives/page-swipe.directive';
import { PagerComponent } from '../pager/pager.component';
@Component({
  selector: 'app-onboarding-catalog',
  imports: [PageSwipeDirective, PagerComponent],
  template: `
    <div class="model">
      <div class="model-bar">
        <b>GSTX</b><span class="desktop">Каталог · Игроки · Моё</span><span class="mobile">⌕　♙　▣</span>
      </div>
      @if (mode === 'search') {
        <div class="search-example">⌕ {{ phase ? 'Night Circuit' : 'Название игры…' }}</div>
      }
      @if (mode === 'filters') {
        <p>1. Платформа → 2. Регион → 3. Условия</p>
        <div class="filters">
          @for (p of ['PS3', 'PS4', 'PS5']; track p) {
            <button
              type="button"
              [class.chosen]="platform === p"
              (click)="platform = p; effect.emit('filter')"
            >
              {{ p }}
            </button>
          }
        </div>
        <div class="filters">
          @for (r of ['Европа', 'Америка', 'Япония']; track r) {
            <button type="button" [class.chosen]="region === r" (click)="region = r; effect.emit('filter')">
              {{ r }}
            </button>
          }
        </div>
        <button type="button" class="condition" [class.chosen]="filtered" (click)="filter()">
          {{ filtered ? '☑' : '☐' }} Локально · 2+ игрока
        </button>
        <p class="sort">Сортировка: по рейтингу ↓</p>
      }
      <div
        class="cards"
        pageSwipe
        (swipePage)="turn(page + $event)"
        [class.turning]="phase === 1 && mode === 'paging'"
      >
        @for (n of [0, 1, 2, 3]; track n) {
          <div class="card-model" [class.dimmed]="filtered && n > 1">
            <img
              src="/tutorial-cover.svg"
              alt="Учебная обложка"
              [style.filter]="'hue-rotate(' + ((page - 1) * 90 + n * 30) + 'deg)'"
            /><span>{{ names[(page - 1) * 4 + n] }}</span
            ><small>★ {{ 96 - n - page }} · {{ platform }}</small>
          </div>
        }
        @if (phase === 1 && mode === 'paging') {
          <span class="gesture mobile" aria-hidden="true">← ◉</span>
        }
      </div>
      @if (mode === 'paging') {
        <div class="desktop keys" [class.pressed]="phase === 1">
          <kbd>←</kbd><kbd>→</kbd><span>Стрелки клавиатуры</span>
        </div>
        <p class="mobile">Свайп влево — дальше, вправо — назад.</p>
        <app-pager [totalCount]="12" [limit]="4" [offset]="(page - 1) * 4" (pageChange)="turn($event)" />
        <small class="instruction"
          >Попробуйте сами: {{ page }} / 3. Кнопки пейджера работают на любом экране.</small
        >
      }
    </div>
  `,
  styleUrl: './onboarding-catalog.component.scss',
})
export class OnboardingCatalogComponent implements OnChanges {
  @Input() mode: 'search' | 'filters' | 'paging' = 'paging';
  @Input() phase = 0;
  @Output() effect = new EventEmitter<'filter' | 'page'>();
  platform = 'PS4';
  region = '';
  page = 1;
  filtered = false;
  readonly names = [
    'Night Circuit',
    'Pixel Quest',
    'Retro Racer',
    'Sky Patrol',
    'Crystal City',
    'Moon Runner',
    'Star Pilot',
    'Ocean Road',
    'Neon Arena',
    'Last Horizon',
    'Shadow Drift',
    'Turbo Club',
  ];
  ngOnChanges() {
    this.page = this.phase === 2 && this.mode === 'paging' ? 2 : 1;
    this.filtered = this.phase === 2 && this.mode === 'filters';
    this.region = this.filtered ? 'Европа' : '';
  }
  turn(page: number) {
    if (page < 1 || page > 3 || page === this.page) return;
    this.page = page;
    this.effect.emit('page');
  }
  filter() {
    this.filtered = !this.filtered;
    this.effect.emit('filter');
  }
}
