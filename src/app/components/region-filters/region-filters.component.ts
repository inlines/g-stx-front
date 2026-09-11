import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { REGION_GROUPS, RegionCounts, RegionGroup } from '@app/shared/region-filter';
@Component({
  selector: 'app-region-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="Регионы релизов">
      <div class="regions" role="group" aria-label="Фильтр по регионам">
        @for (region of groups; track region) {
          <button type="button" [class.selected]="selected.includes(region)" [attr.aria-pressed]="selected.includes(region)" (click)="regionToggle.emit(region)">
            {{ labels[region] }} <span>@if(owned){ {{owned[region] ?? '—'}} / }{{ totals[region] ?? '—' }}</span>
          </button>
        }
      </div>
      <small>{{owned ? 'Есть у игрока / всего на платформе.' : 'Всего игр на платформе.'}} Цифровые не учитываются.</small>
    </section>`,
  styles: `
    :host{display:block;position:relative;z-index:1;margin:12px 0 20px}
    .regions{display:flex;flex-wrap:wrap;gap:8px}
    button{display:flex;align-items:center;gap:8px;min-height:44px;padding:10px 14px;border:1px solid #556078;border-radius:9px;background:#101c2d;color:#c5d4e7;font:inherit;cursor:pointer}
    button.selected{border-color:#c2a4ed;background:#322b4c;color:#fff}
    button:focus-visible{outline:2px solid #c2a4ed;outline-offset:3px}
    span{font-size:.85em;font-variant-numeric:tabular-nums;color:#b9cbe2}
    small{display:block;margin-top:6px;color:#a3b8cb;font-size:12px;line-height:1.4}
    @media(max-width:400px){button{padding:9px 10px;font-size:14px;gap:6px}}
  `,
})
export class RegionFiltersComponent {
  @Input() selected: readonly RegionGroup[] = [];
  @Input() totals: RegionCounts = {};
  @Input() owned?: RegionCounts;
  @Output() regionToggle = new EventEmitter<RegionGroup>();
  readonly groups = REGION_GROUPS;
  readonly labels = { europe: 'Европа', america: 'Америка', other: 'Другие' };
}
