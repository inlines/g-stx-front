import { Store } from '@ngxs/store';
import { PlatformState } from '@app/states/platforms/states/platforms.state';
import { HorizontalFiltersDirective } from '@app/directives/horizontal-filters.directive';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, HostListener, ElementRef, inject, signal } from '@angular/core';
import { REGION_GROUPS, RegionCounts, RegionGroup } from '@app/shared/region-filter';
@Component({
  selector: 'app-region-filters',
  imports: [HorizontalFiltersDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if(pastSelector()) {<nav class="region-breadcrumb" aria-label="Текущая платформа и регион">{{platformName}} / {{regionName}}</nav>}
    <section aria-label="Регионы релизов">
      <div horizontalFilters class="regions" role="group" aria-label="Фильтр по регионам">
        @for (region of groups; track region) {
          <button type="button" [class.selected]="selected.includes(region)" [attr.aria-pressed]="selected.includes(region)" (click)="regionToggle.emit(region)">
            {{ labels[region] }} <span>@if(unknown){ {{unidentified[region] ?? '—'}} / }@else if(owned){ {{owned[region] ?? '—'}} / }{{ totals[region] ?? '—' }}</span>
          </button>
        }
      </div>

      @if(unknown){<small>Неидентифицированные / всего вышедших коробочных игр в регионе. Обе цифры учитывают фильтры.</small>}
    </section>`,
  styles: `
    .region-breadcrumb{position:fixed;top:0;left:0;right:0;z-index:1041;height:44px;padding:0 16px;display:flex;align-items:center;background:#0b1b29;border-bottom:1px solid #405266;color:#e4edf6;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    :host{display:block;position:relative;z-index:1;margin:12px 0 20px}
    .regions{display:flex;flex-wrap:wrap;gap:8px}
    button{display:flex;align-items:center;gap:8px;min-height:44px;padding:10px 14px;border:1px solid #556078;border-radius:9px;background:#101c2d;color:#c5d4e7;font:inherit;cursor:pointer}
    button.selected{border-color:#c2a4ed;background:#322b4c;color:#fff}
    button:focus-visible{outline:2px solid #c2a4ed;outline-offset:3px}
    span{font-size:.85em;font-variant-numeric:tabular-nums;color:#b9cbe2}
    small{display:block;margin-top:6px;color:#a3b8cb;font-size:12px;line-height:1.4}
    @media(max-width:767px){.regions{flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;padding:3px 0 6px}button{flex:0 0 auto;white-space:nowrap}}
    @media(max-width:400px){button{padding:9px 10px;font-size:14px;gap:6px}}
  `,
})
export class RegionFiltersComponent {
  @Input() platformId: number | null = null;
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly platforms = inject(Store).selectSignal(PlatformState.loadedPlatforms);
  readonly pastSelector = signal(false);
  get platformName(): string { const p=this.platforms().find(p=>p.id===this.platformId);return p?.abbreviation || p?.name || 'Все платформы'; }
  get regionName(): string { return this.selected.length ? this.selected.map(r=>this.labels[r]).join(', ') : 'Все регионы'; }
  @HostListener('window:scroll')
  @HostListener('window:resize')
  checkPosition(): void { this.pastSelector.set(this.element.nativeElement.getBoundingClientRect().bottom < 0); }

  @Input() unknown = false;
  @Input() selected: readonly RegionGroup[] = [];
  @Input() totals: RegionCounts = {};
  @Input() owned?: RegionCounts;
  @Input() unidentified: RegionCounts = {};
  @Output() regionToggle = new EventEmitter<RegionGroup>();
  readonly groups = REGION_GROUPS;
  readonly labels = { europe: 'Европа', america: 'Америка', japan: 'Япония', other: 'Другие' };
}
