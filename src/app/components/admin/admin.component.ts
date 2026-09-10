import { AdminRequestsComponent } from '../admin-requests/admin-requests.component';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '@app/services/admin.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Observable, Subscription } from 'rxjs';
import { PagerComponent } from '../pager/pager.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-admin',
  imports: [DatePipe, FormsModule, PagerComponent, UserAvatarComponent, AdminRequestsComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminComponent implements OnInit, OnDestroy {
  readonly currentUserId = input.required<number>();
  readonly accessDenied = output<void>();
  private readonly api = inject(AdminService);
  private readonly destroy = inject(DestroyRef);
  private readonly modal = inject(NgbModal);
  private request?: Subscription;
  private dialog?: NgbModalRef;
  section: 'users' | 'requests' = 'users';
  query = '';
  private search = '';
  users: AdminUser[] = [];
  total = 0;
  readonly limit = 20;
  offset = 0;
  loading = false;
  busy = false;
  error = '';
  success = '';
  selected: AdminUser | null = null;
  action: 'promote' | 'delete' = 'promote';
  confirmation = '';
  actionError = '';

  get confirmationOpen() {
    return !!this.dialog;
  }

  ngOnInit() {
    this.load();
  }
  searchUsers() {
    if (this.busy) return;
    this.search = this.query.trim();
    this.load(0);
  }
  pageChanged(page: number) {
    if (!this.busy && !this.dialog) this.load((page - 1) * this.limit);
  }
  load(offset = this.offset) {
    this.request?.unsubscribe();
    this.loading = true;
    this.error = '';
    this.offset = offset;
    this.request = this.api
      .users(this.search, offset, this.limit)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (response) => {
          this.users = response.items;
          this.total = response.total_count;
          // Another administrator may have removed the final item on this page.
          if (!this.users.length && this.total > 0 && this.offset >= this.total) {
            this.load(Math.floor((this.total - 1) / this.limit) * this.limit);
          }
        },
        error: (error) => {
          this.users = [];
          this.total = 0;
          this.error = error.error?.error || 'Не удалось загрузить пользователей';
          if (error.status === 403) this.accessDenied.emit();
        },
      });
  }
  open(user: AdminUser, action: 'promote' | 'delete', template: TemplateRef<unknown>) {
    if (this.busy || user.id === this.currentUserId() || (action === 'promote' && user.is_admin)) return;
    this.selected = user;
    this.action = action;
    this.confirmation = this.actionError = '';
    this.dialog = this.modal.open(template, {
      centered: true,
      ariaLabelledBy: 'admin-confirm-title',
      ariaDescribedBy: 'admin-confirm-description',
      beforeDismiss: () => !this.busy,
    });
    const dialog = this.dialog;
    const clearDialog = () => {
      if (this.dialog === dialog) {
        this.dialog = undefined;
        this.selected = null;
      }
    };
    dialog.result.then(clearDialog, clearDialog);
  }
  cancel() {
    if (!this.busy) this.dialog?.dismiss();
  }
  confirm() {
    const user = this.selected;
    if (
      !user ||
      this.busy ||
      user.id === this.currentUserId() ||
      (this.action === 'delete' && this.confirmation !== user.user_login)
    )
      return;
    this.busy = true;
    this.actionError = this.success = '';
    const request: Observable<unknown> =
      this.action === 'delete' ? this.api.delete(user.id) : this.api.promote(user.id);
    request
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.busy = false)),
      )
      .subscribe({
        next: () => {
          this.success =
            this.action === 'delete'
              ? `Пользователь ${user.user_login} удалён`
              : `${user.user_login} назначен администратором`;
          this.dialog?.close();
          this.selected = null;
          this.load();
        },
        error: (error) => {
          this.actionError = error.error?.error || 'Не удалось выполнить операцию. Попробуйте ещё раз';
          if (error.status === 403) {
            this.dialog?.close();
            this.accessDenied.emit();
          }
        },
      });
  }
  ngOnDestroy() {
    this.dialog?.close();
  }
}
