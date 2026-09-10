import { KudosComponent } from '../kudos/kudos.component';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '@app/services/profile.service';
import { AuthState } from '@app/states/auth/states/auth.state';
import { Store } from '@ngxs/store';
import { finalize } from 'rxjs';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { AdminComponent } from '../admin/admin.component';
import { AdminService, AdminUser } from '@app/services/admin.service';
import { cropSquare, pixelAvatar } from './avatar-image';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [KudosComponent, AsyncPipe, FormsModule, ReactiveFormsModule, UserAvatarComponent, AdminComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnDestroy, OnInit {
  private readonly api = inject(ProfileService);
  private readonly destroy = inject(DestroyRef);
  readonly login$ = inject(Store).select(AuthState.login);
  readonly Math = Math;
  private readonly adminApi = inject(AdminService);
  me: AdminUser | null = null;
  roleError = '';
  ngOnInit() {
    this.loadRole();
  }
  loadRole() {
    this.roleError = '';
    this.adminApi
      .me()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (me) => (this.me = me),
        error: () => {
          this.me = null;
          this.roleError = 'Не удалось загрузить права доступа';
        },
      });
  }
  adminAccessDenied() {
    this.me = null;
    this.tab = 'password';
    this.roleError = 'Доступ к админке больше недоступен';
  }
  tab: 'password' | 'avatar' | 'admin' = 'password';
  readonly password = new FormGroup({
    old: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    next: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
    }),
    confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  passwordBusy = false;
  passwordError = '';
  passwordSuccess = '';
  avatarBusy = false;
  avatarError = '';
  avatarSuccess = '';
  loading = false;
  dragging = false;
  image: HTMLImageElement | null = null;
  sourceUrl = '';
  previewUrl = '';
  blob: Blob | null = null;
  zoom = 1;
  x = 50;
  y = 50;
  pixels = 32;
  private revision = 0;
  private fileRevision = 0;
  private drag: { x: number; y: number; cropX: number; cropY: number; width: number; height: number } | null =
    null;

  changePassword() {
    this.passwordError = this.passwordSuccess = '';
    this.password.markAllAsTouched();
    if (this.password.invalid || this.passwordBusy) return;
    const { old, next, confirm } = this.password.getRawValue();
    if (next !== confirm) {
      this.passwordError = 'Новые пароли не совпадают';
      return;
    }
    this.passwordBusy = true;
    this.api
      .changePassword(old, next, confirm)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.passwordBusy = false)),
      )
      .subscribe({
        next: () => {
          this.password.reset();
          this.passwordSuccess = 'Пароль изменён';
        },
        error: (error) =>
          (this.passwordError = error.error?.error || 'Не удалось изменить пароль. Попробуйте ещё раз.'),
      });
  }
  fileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void this.loadFile(file);
    input.value = '';
  }
  drop(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) void this.loadFile(file);
  }
  async loadFile(file: File) {
    if (this.avatarBusy) return;
    this.avatarError = this.avatarSuccess = '';
    if (file.size > 10 * 1024 * 1024) {
      this.avatarError = 'Выберите изображение до 10 МБ';
      return;
    }
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)) {
      this.avatarError = 'Поддерживаются JPEG, PNG, WebP и HEIC/HEIF, если браузер умеет их открывать';
      return;
    }
    const revision = ++this.fileRevision;
    ++this.revision;
    this.loading = true;
    this.blob = null;
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (revision !== this.fileRevision) {
        URL.revokeObjectURL(url);
        return;
      }
      if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 24000000)
        throw new Error('Выберите изображение не более 24 мегапикселей');
      URL.revokeObjectURL(this.sourceUrl);
      this.sourceUrl = url;
      this.image = image;
      this.zoom = 1;
      this.x = this.y = 50;
      await this.updatePreview();
    } catch (error) {
      URL.revokeObjectURL(url);
      if (revision === this.fileRevision)
        this.avatarError =
          error instanceof Error && error.message.includes('мегапикселей')
            ? error.message
            : 'Не удалось открыть фото. Попробуйте JPEG, PNG или WebP (для HEIC может потребоваться конвертация).';
    } finally {
      if (revision === this.fileRevision) this.loading = false;
    }
  }
  get crop() {
    if (!this.image) return { left: 0, top: 0, width: 100, height: 100 };
    const { naturalWidth: w, naturalHeight: h } = this.image;
    const crop = cropSquare(w, h, this.zoom, this.x, this.y);
    return {
      left: (crop.x / w) * 100,
      top: (crop.y / h) * 100,
      width: (crop.size / w) * 100,
      height: (crop.size / h) * 100,
    };
  }
  async updatePreview() {
    if (!this.image || this.avatarBusy) return;
    const revision = ++this.revision;
    this.blob = null;
    this.avatarSuccess = '';
    try {
      const blob = await pixelAvatar(this.image, this.zoom, this.x, this.y, this.pixels);
      if (revision !== this.revision) return;
      if (blob.size > 32768) throw new Error('Аватар превышает 32 КБ');
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = URL.createObjectURL(blob);
      this.blob = blob;
    } catch (error) {
      if (revision === this.revision)
        this.avatarError = error instanceof Error ? error.message : 'Не удалось обработать фото';
    }
  }
  startDrag(event: PointerEvent) {
    if (this.avatarBusy || this.loading) return;
    const element = event.currentTarget as HTMLElement;
    const box = element.parentElement!.getBoundingClientRect();
    this.drag = {
      x: event.clientX,
      y: event.clientY,
      cropX: this.x,
      cropY: this.y,
      width: box.width,
      height: box.height,
    };
    element.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  moveDrag(event: PointerEvent) {
    if (!this.drag) return;
    const dx = this.drag.width * (1 - this.crop.width / 100);
    const dy = this.drag.height * (1 - this.crop.height / 100);
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    if (dx > 0) this.x = clamp(this.drag.cropX + ((event.clientX - this.drag.x) / dx) * 100);
    if (dy > 0) this.y = clamp(this.drag.cropY + ((event.clientY - this.drag.y) / dy) * 100);
    void this.updatePreview();
  }
  endDrag() {
    this.drag = null;
  }
  saveAvatar() {
    if (!this.blob || this.avatarBusy || this.loading) return;
    this.avatarBusy = true;
    this.avatarError = this.avatarSuccess = '';
    this.api
      .saveAvatar(this.blob)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.avatarBusy = false)),
      )
      .subscribe({
        next: () => (this.avatarSuccess = 'Аватар сохранён'),
        error: (error) =>
          (this.avatarError = error.error?.error || 'Не удалось сохранить аватар. Попробуйте ещё раз.'),
      });
  }
  ngOnDestroy() {
    ++this.revision;
    ++this.fileRevision;
    URL.revokeObjectURL(this.sourceUrl);
    URL.revokeObjectURL(this.previewUrl);
  }
}
