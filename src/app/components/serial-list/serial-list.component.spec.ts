import { TestBed } from '@angular/core/testing';
import { SerialListComponent } from './serial-list.component';
describe('Serial disclosure', () => {
  it('retains order, exposes every code and stops parent card navigation', () => {
    const fixture = TestBed.createComponent(SerialListComponent);
    fixture.componentRef.setInput('serials', ['SLUS-12345', 'CUSA-12345', 'CUSA12345']);
    fixture.detectChanges();
    const click = vi.fn();
    fixture.nativeElement.addEventListener('click', click);
    const details = fixture.nativeElement.querySelector('details');
    expect(details.open).toBe(false);
    details.querySelector('summary').click();
    expect(details.open).toBe(true);
    expect(click).not.toHaveBeenCalled();
    expect(details.querySelector('summary').textContent).toContain('SLUS-12345');
    expect(details.querySelectorAll('li').length).toBe(2);
    fixture.destroy();
  });
});
