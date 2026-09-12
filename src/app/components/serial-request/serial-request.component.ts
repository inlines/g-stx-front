import { Store } from '@ngxs/store';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { canonicalSerial, validSerial, SERIAL_HINT } from '@app/shared/serial-number';
import { normalizeAlternativeName, validAlternativeName } from '@app/shared/contribution-value';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IReleaseItem } from '@app/states/products/interfaces/release-item.interface';
import { SerialRequestsService } from '@app/services/serial-requests.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Observable } from 'rxjs';
import { preparePhoto } from './prepare-photo';

@Component({
  selector: 'app-serial-request',
  imports: [FormsModule],
  templateUrl: './serial-request.component.html',
  styleUrl: './serial-request.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SerialRequestComponent implements OnDestroy {
  @Input() release!: IReleaseItem;
  @Input() direct = false;
  private readonly store = inject(Store);
  @Input() productName = '';
  @Input() productId = 0;
  @Input() kind: 'serial' | 'alternative_name' = 'serial';
  @Input() existingNames: string[] = [];
  get isName() {
    return this.kind === 'alternative_name';
  }
  get existingValues() {
    return this.isName ? this.existingNames : (this.release?.serial ?? []);
  }
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
    return this.isName ? normalizeAlternativeName(this.serial) : canonicalSerial(this.serial);
  }
  readonly serialHint = SERIAL_HINT;
  get validSerial() {
    if (this.isName) return validAlternativeName(this.normalizedSerial);
    return validSerial(this.normalizedSerial);
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
    if (
      !this.validSerial ||
      (!this.direct && (!this.photo || !this.readable)) ||
      this.busy ||
      this.preparing ||
      this.sent
    )
      return;
    if (
      (this.isName ? [...this.existingNames, this.productName] : this.existingValues).some(
        (s) => (this.isName ? s.trim().toUpperCase() : canonicalSerial(s)) === this.normalizedSerial.toUpperCase(),
      )
    ) {
      this.error = this.isName ? 'Это название уже указано у игры' : 'Этот серийник уже указан у релиза';
      return;
    }
    this.busy = true;
    this.error = '';
    const request: Observable<unknown> = this.direct
      ? this.isName
        ? this.api.addNameDirect(this.productId, this.normalizedSerial)
        : this.api.addSerialDirect(this.release.release_id, this.normalizedSerial)
      : this.isName
        ? this.api.submitName(this.productId, this.normalizedSerial, this.photo!)
        : this.api.submit(this.release.release_id, this.normalizedSerial, this.photo!);
    request
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.busy = false)),
      )
      .subscribe({
        next: () => {
          this.sent = true;
          if (this.direct) {
            this.store.dispatch(new ProductsActions.LoadProperties(this.productId));
            this.modal.close(true);
          }
        },
        error: (error) =>
          (this.error =
            error.error?.error ||
            (this.direct
              ? 'Не удалось сохранить изменение. Попробуйте ещё раз.'
              : 'Не удалось отправить заявку. Попробуйте ещё раз.')),
      });
  }
  ngOnDestroy() {
    ++this.revision;
    URL.revokeObjectURL(this.preview);
  }
}
