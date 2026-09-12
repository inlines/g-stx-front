import { canonicalSerial, validSerial, SERIAL_HINT } from '@app/shared/serial-number';
import { normalizeAlternativeName, validAlternativeName } from '@app/shared/contribution-value';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SerialRequest, SerialRequestsService } from '@app/services/serial-requests.service';
import { finalize, Subscription } from 'rxjs';
import { PagerComponent } from '../pager/pager.component';
import { RequestPhotoComponent } from './request-photo.component';

@Component({
  selector: 'app-admin-requests',
  imports: [FormsModule, DatePipe, RouterLink, PagerComponent, RequestPhotoComponent],
  templateUrl: './admin-requests.component.html',
  styleUrl: './admin-requests.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminRequestsComponent implements OnInit {
  private readonly api = inject(SerialRequestsService);
  private readonly destroy = inject(DestroyRef);
  readonly accessDenied = output<void>();
  status: 'pending' | 'accepted' = 'pending';
  items: SerialRequest[] = [];
  total = 0;
  offset = 0;
  readonly limit = 10;
  loading = false;
  busy = false;
  error = '';
  success = '';
  decision: { item: SerialRequest; action: 'accept' | 'reject' | 'delete' } | null = null;
  editedSerial = '';
  isName(item: SerialRequest) {
    return item.kind === 'alternative_name';
  }
  get nameDecision() {
    return this.decision?.item.kind === 'alternative_name';
  }
  get normalizedSerial() {
    return this.nameDecision
      ? normalizeAlternativeName(this.editedSerial)
      : canonicalSerial(this.editedSerial);
  }
  readonly serialHint = SERIAL_HINT;
  get validSerial() {
    if (this.nameDecision) return validAlternativeName(this.normalizedSerial);
    return validSerial(this.normalizedSerial);
  }
  decide(item: SerialRequest, action: 'accept' | 'reject' | 'delete') {
    if (this.busy) return;
    this.editedSerial = item.serial;
    this.decision = { item, action };
    this.error = '';
  }
  private request?: Subscription;
  ngOnInit() {
    this.load();
  }
  select(status: 'pending' | 'accepted') {
    if (this.busy || this.status === status) return;
    this.status = status;
    this.decision = null;
    this.success = '';
    this.load(0);
  }
  page(page: number) {
    if (!this.busy) {
      this.decision = null;
      this.load((page - 1) * this.limit);
    }
  }
  load(offset = this.offset) {
    this.request?.unsubscribe();
    this.offset = offset;
    this.error = '';
    this.loading = true;
    this.request = this.api
      .list(this.status, offset, this.limit)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (response) => {
          this.items = response.items;
          this.total = response.total_count;
          if (!this.items.length && this.total && offset >= this.total)
            this.load(Math.floor((this.total - 1) / this.limit) * this.limit);
        },
        error: (error) => {
          this.items = [];
          this.total = 0;
          this.error = error.error?.error || 'Не удалось загрузить заявки';
          if (error.status === 403) this.accessDenied.emit();
        },
      });
  }
  confirm() {
    if (!this.decision || this.busy) return;
    const { item, action } = this.decision;
    if (action === 'accept' && !this.validSerial) return;
    const serial = this.normalizedSerial;
    this.busy = true;
    this.error = '';
    this.success = '';
    const request =
      action === 'accept'
        ? this.api.accept(item.id, serial)
        : action === 'delete'
          ? this.api.deleteArchived(item.id)
          : this.api.reject(item.id);
    request
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.busy = false)),
      )
      .subscribe({
        next: () => {
          this.decision = null;
          this.success =
            action === 'accept'
              ? `${this.isName(item) ? 'Название' : 'Серийник'} ${serial} добавлен${this.isName(item) ? 'о' : ''}. Заявка перенесена в архив.`
              : 'Заявка и фотография удалены.';
          this.load();
        },
        error: (error) => {
          this.error =
            error.error?.error || 'Не удалось обработать заявку. Обновите список и попробуйте ещё раз.';
          if (error.status === 403) this.accessDenied.emit();
        },
      });
  }
}
