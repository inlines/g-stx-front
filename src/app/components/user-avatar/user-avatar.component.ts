import { ChangeDetectionStrategy, Component, Input, OnChanges, effect, inject } from '@angular/core';
import { ProfileService } from '@app/services/profile.service';
@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `@if (login && !failed) {
      <img [src]="profile.avatarUrl(login)" alt="" (error)="failed = true" loading="lazy" />
    } @else {
      <span aria-hidden="true">{{ login?.slice(0, 1)?.toUpperCase() || '•' }}</span>
    }`,
  styles: [
    `
      :host {
        display: inline-flex;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        border-radius: 8px;
        overflow: hidden;
        background: #294053;
        color: #c2a4ed;
        vertical-align: middle;
      }
      img {
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
        object-fit: cover;
      }
      span {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }
    `,
  ],
})
export class UserAvatarComponent implements OnChanges {
  @Input() login: string | null = null;
  readonly profile = inject(ProfileService);
  failed = false;
  constructor() {
    effect(() => {
      this.profile.avatarVersion();
      this.failed = false;
    });
  }
  ngOnChanges() {
    this.failed = false;
  }
}
