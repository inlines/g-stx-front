import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';

import { PagerComponent } from './pager.component';

describe('PagerComponent', () => {
  let component: PagerComponent;
  let fixture: ComponentFixture<PagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: TEST_PROVIDERS,
      imports: [PagerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps the committed page until the parent supplies a new offset, including keyboard navigation', () => {
    fixture.componentRef.setInput('totalCount', 100);
    fixture.componentRef.setInput('limit', 10);
    fixture.detectChanges();
    const changes = vi.fn();
    component.pageChange.subscribe(changes);
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(changes).toHaveBeenLastCalledWith(2);
    expect(component.currentPage).toBe(1);
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(changes).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('offset', 10);
    fixture.componentRef.setInput('busy', false);
    fixture.detectChanges();
    expect(component.currentPage).toBe(2);
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(changes).toHaveBeenLastCalledWith(1);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(changes).toHaveBeenCalledTimes(2);
    input.remove();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
