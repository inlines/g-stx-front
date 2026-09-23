import { TestBed } from '@angular/core/testing';
import { GameSearchComponent } from './game-search.component';

describe('GameSearchComponent', () => {
  it('formats paste, preserves caret and emits a single canonical value', () => {
    const fixture = TestBed.createComponent(GameSearchComponent);
    fixture.componentRef.setInput('mode', 'serial');
    fixture.componentRef.setInput('platform', 9);
    fixture.detectChanges();
    const changed = vi.fn();
    fixture.componentInstance.registerOnChange(changed);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'bles12345/ANZ';
    input.setSelectionRange(12, 12);
    input.dispatchEvent(new InputEvent('input', { inputType: 'insertFromPaste', bubbles: true }));
    expect(input.value).toBe('BLES-12345/ANZ');
    expect(changed).toHaveBeenCalledExactlyOnceWith('BLES-12345/ANZ');
    expect(input.placeholder).toBe('BLES-00001');
  });
  it('clears a restored search value and emits the empty query', () => {
    const fixture = TestBed.createComponent(GameSearchComponent);
    const changed = vi.fn();
    fixture.componentInstance.registerOnChange(changed);
    fixture.componentInstance.writeValue('Metal Gear Solid');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.clear-search').click();
    fixture.detectChanges();
    expect(changed).toHaveBeenCalledExactlyOnceWith('');
    expect(fixture.nativeElement.querySelector('input').value).toBe('');
    expect(fixture.nativeElement.querySelector('.clear-search')).toBeNull();
  });
  it('does not alter names and exposes the mode switch and disabled state', () => {
    const fixture = TestBed.createComponent(GameSearchComponent);
    const changed = vi.fn();
    fixture.componentInstance.registerOnChange(changed);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Metal Gear: Solid';
    input.dispatchEvent(new Event('input'));
    expect(changed).toHaveBeenCalledWith('Metal Gear: Solid');
    const mode = vi.fn();
    fixture.componentInstance.modeChange.subscribe(mode);
    const select = fixture.nativeElement.querySelector('select');
    select.value = 'serial';
    select.dispatchEvent(new Event('change'));
    expect(mode).toHaveBeenCalledWith('serial');
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(select.disabled).toBe(true);
  });
});
