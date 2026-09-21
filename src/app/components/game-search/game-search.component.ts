import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SearchMode, validSerial } from '@app/shared/serial-number';
import { formatSerialInput, serialExample } from '@app/shared/serial-input';

@Component({
  selector: 'app-game-search',
  templateUrl: './game-search.component.html',
  styleUrl: './game-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GameSearchComponent), multi: true },
  ],
})
export class GameSearchComponent implements ControlValueAccessor {
  private static nextId = 0;
  readonly helpId = `game-search-help-${GameSearchComponent.nextId++}`;
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('input') input?: ElementRef<HTMLInputElement>;
  @Input() mode: SearchMode = 'name';
  @Input() platform: number | null | undefined;
  @Output() modeChange = new EventEmitter<SearchMode>();
  value = '';
  disabled = false;
  private changed: (value: string) => void = () => {};
  touched: () => void = () => {};
  get example(): string {
    return serialExample(this.platform);
  }
  get invalid(): boolean {
    return this.mode === 'serial' && !!this.value && !validSerial(this.value);
  }
  focus(): void {
    this.input?.nativeElement.focus();
  }
  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.cdr.markForCheck();
  }
  registerOnChange(fn: (value: string) => void): void {
    this.changed = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.cdr.markForCheck();
  }
  changeMode(event: Event): void {
    this.modeChange.emit((event.target as HTMLSelectElement).value as SearchMode);
    this.touched();
  }
  inputChanged(event: Event): void {
    const input = event.target as HTMLInputElement;
    const typed = event as InputEvent;
    if (typed.isComposing) return;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const deleting = typed.inputType?.startsWith('delete') ?? false;
    this.value = this.mode === 'serial' ? formatSerialInput(raw, deleting) : raw;
    input.value = this.value;
    if (this.mode === 'serial') {
      const nextCaret = formatSerialInput(raw.slice(0, caret), deleting).length;
      input.setSelectionRange(nextCaret, nextCaret);
    }
    this.changed(this.value);
  }
}
