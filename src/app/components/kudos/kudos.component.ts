import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KudosService } from '@app/services/kudos.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-kudos',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    '[class.compact]': 'compact',
    '[attr.aria-label]': 'amount === null ? "Kudos: загружается" : amount + " Kudos"',
    title: 'Kudos — награда за вклад в каталог. +10 за серийник, +5 за альтернативное название',
  },
  template: `<span class="word" aria-hidden="true"><b>K</b><span class="udos">udos</span></span
    ><strong class="points" aria-hidden="true">{{
      amount === null ? '—' : amount.toLocaleString('ru-RU')
    }}</strong>`,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        flex-wrap: wrap;
        max-width: 100%;
        vertical-align: middle;
        font-family: Arial, sans-serif;
        line-height: 1.1;
      }
      .word {
        display: inline-flex;
        align-items: baseline;
        transform: skew(-9deg);
        font-style: italic;
        font-weight: 900;
        color: #f6d875;
        text-shadow: 1px 2px 0 #54380b;
      }
      b {
        font-size: 1.8em;
        line-height: 0.9;
        color: #ffd353;
        text-shadow:
          -1px -1px 0 #fff2b5,
          2px 2px 0 #8b5b12;
      }
      .udos {
        font-size: 0.85em;
        margin-left: -2px;
        letter-spacing: -0.06em;
      }
      .points {
        overflow-wrap: anywhere;
        min-width: 0;
        font-size: 1.3em;
        font-style: italic;
        color: #fff8dc;
        font-variant-numeric: tabular-nums;
        text-shadow: 1px 2px #161c29;
      }
      :host.compact {
        gap: 5px;
        font-size: 13px;
      }
      :host.compact .udos {
        display: none;
      }
      :host.compact b {
        font-size: 1.45em;
      }
      :host.compact .points {
        overflow-wrap: anywhere;
        min-width: 0;
        font-size: 1.1em;
      }
    `,
  ],
})
export class KudosComponent implements OnChanges {
  @Input() login: string | null = null;
  @Input() value: number | undefined;
  @Input() compact = false;
  amount: number | null = null;
  private readonly service = inject(KudosService);
  private readonly destroy = inject(DestroyRef);
  private request?: Subscription;
  ngOnChanges() {
    this.request?.unsubscribe();
    this.amount = this.value ?? null;
    if (this.value === undefined && this.login) {
      this.request = this.service
        .score(this.login)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe((score) => (this.amount = score?.kudos ?? null));
    }
  }
}
