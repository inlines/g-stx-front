import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Retain the last result in normal flow while its replacement loads. */
@Component({
  selector: 'app-loading-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content" [attr.inert]="loading ? '' : null" [attr.aria-busy]="loading">
      <ng-content />
    </div>
    @if (loading) {
      <div class="shade"><span role="status">Загружается…</span></div>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      min-width: 0;
    }
    :host:has(.shade) {
      min-height: 240px;
    }
    .shade {
      position: absolute;
      inset: 0;
      z-index: 10;
      background: rgba(4, 13, 23, 0.72);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 12px;
      cursor: progress;
    }
    .shade span {
      position: sticky;
      top: 45dvh;
      padding: 12px 20px;
      border: 1px solid #8095b3;
      border-radius: 12px;
      background: #102231;
      color: #e4edf6;
      font-size: 16px;
      box-shadow: 0 8px 30px #0006;
    }
  `,
})
export class LoadingPanelComponent {
  @Input() loading = false;
}
