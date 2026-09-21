/** Align content below the actual sticky header, which is in normal flow on mobile. */
export function scrollToContent(target: HTMLElement | undefined, gap = 12): void {
  if (!target) return;
  const header = document.querySelector<HTMLElement>('.layout-wrapper > header');
  const position = header ? getComputedStyle(header).position : '';
  const height = header && (position === 'sticky' || position === 'fixed')
    ? header.getBoundingClientRect().height
    : 0;
  target.style.scrollMarginTop = `${height + gap}px`;
  target.scrollIntoView?.({ block: 'start', behavior: 'instant' });
}
