import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IReleaseItem } from '@app/states/products/interfaces/release-item.interface';
import { SerialRequestsService } from '@app/services/serial-requests.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import { preparePhoto } from './prepare-photo';

@Component({
  selector: 'app-serial-request',
  imports: [FormsModule],
  templateUrl: './serial-request.component.html',
  styleUrl: './serial-request.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SerialRequestComponent implements OnDestroy {
  @Input({ required: true }) release!: IReleaseItem;
  @Input() productName = '';
  readonly modal = inject(NgbActiveModal);
  private readonly api = inject(SerialRequestsService);
  private readonly destroy = inject(DestroyRef);
  serial = '';
  photo: Blob | null = null;
  preview = '';
  preparing = false;
  busy = false;
  readable = false;
  sent = false;
  error = '';
  private revision = 0;
  get normalizedSerial() {
    return this.serial.trim().toUpperCase();
  }
  get validSerial() {
    return /^[A-Z0-9 ._/-]{3,64}$/.test(this.normalizedSerial) && /[A-Z0-9]/.test(this.normalizedSerial);
  }
  async choose(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) await this.load(file);
  }
  async load(file: File) {
    if (this.busy) return;
    const revision = ++this.revision;
    this.preparing = true;
    this.error = '';
    this.photo = null;
    this.readable = false;
    URL.revokeObjectURL(this.preview);
    this.preview = '';
    try {
      const photo = await preparePhoto(file);
      if (revision !== this.revision) return;
      this.photo = photo;
      this.preview = URL.createObjectURL(photo);
    } catch (error) {
      if (revision === this.revision)
        this.error = error instanceof Error ? error.message : 'Не удалось обработать фотографию';
    } finally {
      if (revision === this.revision) this.preparing = false;
    }
  }
  submit() {
    if (!this.validSerial || !this.photo || !this.readable || this.busy || this.preparing || this.sent)
      return;
    if (this.release.serial?.some((s) => s.trim().toUpperCase() === this.normalizedSerial)) {
      this.error = 'Этот серийник уже указан у релиза';
      return;
    }
    this.busy = true;
    this.error = '';
    this.api
      .submit(this.release.release_id, this.normalizedSerial, this.photo)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.busy = false)),
      )
      .subscribe({
        next: () => (this.sent = true),
        error: (error) =>
          (this.error = error.error?.error || 'Не удалось отправить заявку. Попробуйте ещё раз.'),
      });
  }
  ngOnDestroy() {
    ++this.revision;
    URL.revokeObjectURL(this.preview);
  }
}
