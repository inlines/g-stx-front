import { afterEveryRender, Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: '[horizontalFilters]' })
export class HorizontalFiltersDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private previous = '';
  constructor() {
    afterEveryRender(() => {
      const buttons = Array.from(this.host.querySelectorAll<HTMLElement>('button[aria-pressed]'));
      const key = `${this.host.clientWidth}:` + buttons.map(button => button.getAttribute('aria-pressed')).join(',');
      if (key === this.previous) return;
      this.previous = key;
      if (window.innerWidth > 767) return;
      const selected = buttons.find(button => button.getAttribute('aria-pressed') === 'true');
      if (!selected) return;
      // Only move this strip, never the page or its other filters.
      const strip = this.host.getBoundingClientRect(), item = selected.getBoundingClientRect();
      if (item.left < strip.left) this.host.scrollLeft += item.left - strip.left;
      else if (item.right > strip.right) this.host.scrollLeft += item.right - strip.right;
    });
  }
}
