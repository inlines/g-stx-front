import { scrollToContent } from './scroll-to-content';

describe('scrollToContent', () => {
  it.each(['sticky', 'fixed', 'relative'])('accounts for a %s header', (position) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'layout-wrapper';
    const header = document.createElement('header');
    header.style.position = position;
    wrapper.append(header);
    document.body.append(wrapper);
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ height: 152 } as DOMRect);
    const target = document.createElement('h1');
    target.scrollIntoView = vi.fn();
    try {
      scrollToContent(target, 24);
      expect(target.style.scrollMarginTop).toBe(position === 'relative' ? '24px' : '176px');
      expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
    } finally { wrapper.remove(); }
  });
});
