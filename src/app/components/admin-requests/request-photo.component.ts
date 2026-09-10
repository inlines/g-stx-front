import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SerialRequestsService } from '@app/services/serial-requests.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-request-photo',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `@if (url) {
      <a [href]="url" target="_blank" rel="noopener"
        ><img [src]="url" alt="Фото, подтверждающее заявку" /><span>Открыть фото крупно ↗</span></a
      >
    } @else if (failed) {
      <p>Не удалось загрузить фото. <button type="button" (click)="load()">Повторить</button></p>
    } @else {
      <p role="status">Загружаем фото…</p>
    }`,
  styles: [
    `
      :host {
        display: block;
      }
      img {
        display: block;
        max-width: 100%;
        max-height: 260px;
        object-fit: contain;
        margin: auto;
      }
      a {
        display: block;
        color: #d5b8ff;
      }
      span {
        display: block;
        margin-top: 8px;
      }
      button {
        min-height: 44px;
        background: #21354b;
        color: #e4edf6;
        border: 1px solid #536f89;
        border-radius: 8px;
      }
    `,
  ],
})
export class RequestPhotoComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) requestId!: number;
  private readonly api = inject(SerialRequestsService);
  private readonly destroy = inject(DestroyRef);
  private request?: Subscription;
  url = '';
  failed = false;
  ngOnChanges() {
    this.load();
  }
  load() {
    this.request?.unsubscribe();
    URL.revokeObjectURL(this.url);
    this.url = '';
    this.failed = false;
    // Authenticated HttpClient request, not a public image URL or a token in the URL.
    this.request = this.api
      .photo(this.requestId)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (blob) => (this.url = URL.createObjectURL(blob)),
        error: () => (this.failed = true),
      });
  }
  ngOnDestroy() {
    URL.revokeObjectURL(this.url);
  }
}
