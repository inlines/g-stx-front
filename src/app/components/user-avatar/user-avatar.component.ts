import { AsyncPipe } from '@angular/common';
import { UserBadgesService } from '@app/services/user-badges.service';
import { ChangeDetectionStrategy, Component, Input, OnChanges, effect, inject } from '@angular/core';
import { ProfileService } from '@app/services/profile.service';
@Component({
  selector: 'app-user-avatar',
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `@if (login && !failed) {
      <img [src]="profile.avatarUrl(login)" alt="" (error)="failed = true" loading="lazy" />
    } @else {
      <span aria-hidden="true">{{ login?.slice(0, 1)?.toUpperCase() || '•' }}</span>
    }
    @if (login && (badges.admins$ | async)?.includes(login)) {
      <svg
        class="admin-crown"
        viewBox="0 0 20 14"
        role="img"
        aria-label="Администратор"
        shape-rendering="crispEdges"
      >
        <title>Администратор</title>
        <path fill="#302035" d="M0 0h4v2h2v2h2V0h4v4h2V2h2V0h4v10h-2v4H2v-4H0Z" />
        <path fill="#ffd45b" d="M2 2h2v2h2v2h2V4h1V2h2v2h1v2h2V4h2V2h2v6H2Z" />
        <path fill="#f4a936" d="M2 8h16v2H2Zm2 2h12v2H4Z" />
        <path fill="#fff1a6" d="M2 2h2v2H2Zm7 0h2v3H9Zm7 0h2v2h-2Z" />
        <path fill="#d96b89" d="M9 8h2v2H9Z" />
      </svg>
    }`,
  styles: [
    `
      :host {
        display: inline-flex;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        border-radius: 8px;
        position: relative;
        overflow: visible;
        background: #294053;
        color: #c2a4ed;
        vertical-align: middle;
      }
      img {
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
        object-fit: cover;
        border-radius: inherit;
      }
      .admin-crown {
        position: absolute;
        top: 1px;
        right: 1px;
        width: 58%;
        min-width: 18px;
        max-width: 40px;
        height: auto;
        z-index: 2;
        pointer-events: none;
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
  readonly badges = inject(UserBadgesService);
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
