import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { canonicalSerial, displaySerials } from '@app/shared/serial-number';
@Component({
  selector: 'app-serial-list',
  imports: [NgbTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (values.length === 1) {
      <small class="single" [class.owned]="isOwned(values[0])" [attr.aria-label]="'Серийник: ' + values[0]">{{ values[0] }}</small>
    } @else if (values.length > 1) {
      <details class="serials" (click)="$event.stopPropagation()">
        <summary
          [ngbTooltip]="preview"
          triggers="mouseenter:mouseleave"
          container="body"
          aria-label="Раскрыть серийники"
        >
          <b [class.owned]="isOwned(values[0])">{{ values[0] }}</b> <span>+{{ values.length - 1 }}</span>
        </summary>
        <ul aria-label="Все серийники">
          @for (serial of values; track serial) {
            <li [class.owned]="isOwned(serial)">{{ serial }}@if(isOwned(serial)){ <span aria-label="В вашей коллекции">✓</span>}</li>
          }
        </ul>
      </details>
    }`,
  styles: `
    :host {
      display: block;
      position: relative;
      z-index: 2;
      min-width: 0;
      margin: 8px 0;
      color: #d4c5f2;
      font-size: 13px;
      overflow-wrap: anywhere;
    }
    b { font-weight: inherit; }
    .owned { color: #a8edb8; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
    .single {
      font-size: inherit;
    }
    .serials summary {
      cursor: pointer;
      min-height: 44px;
      align-content: center;
      width: fit-content;
      max-width: 100%;
      border-radius: 6px;
    }
    .serials summary:focus-visible {
      outline: 2px solid #bda7ea;
      outline-offset: 3px;
    }
    .serials summary span {
      color: #eabcf7;
      white-space: nowrap;
    }
    ul {
      margin: 6px 0 0;
      padding: 8px 12px;
      list-style: none;
      max-height: 160px;
      overflow: auto;
      background: #282139;
      border-radius: 8px;
    }
    li {
      padding: 3px 0;
    }
  `,
})
export class SerialListComponent {
  @Input() ownedSerials: readonly string[] = [];
  isOwned(serial: string): boolean { return this.ownedSerials.some(value => canonicalSerial(value) === canonicalSerial(serial)); }
  values: string[] = [];
  preview = '';
  @Input() set serials(values: readonly string[] | null | undefined) {
    this.values = displaySerials(values);
    this.preview = this.values.slice(0, 3).join(' · ') + (this.values.length > 3 ? ' · …' : '');
  }
}
