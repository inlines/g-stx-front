import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChatViewportDirective } from './chat-viewport.directive';

@Component({ imports: [ChatViewportDirective], template: '<div chatViewport></div>' })
class TestChat {}

describe('Chat visual viewport', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('keeps the composer inside the keyboard viewport and removes listeners on destroy', () => {
    const viewport = Object.assign(new EventTarget(), { height: 812, offsetTop: 0, scale: 1 });
    vi.stubGlobal('visualViewport', viewport);
    TestBed.configureTestingModule({ imports: [TestChat] });
    const fixture = TestBed.createComponent(TestChat);
    fixture.detectChanges();
    const style = fixture.nativeElement.firstElementChild.style;
    expect(style.getPropertyValue('--chat-height')).toBe('812px');
    viewport.height = 420;
    viewport.offsetTop = 70;
    viewport.dispatchEvent(new Event('resize'));
    expect(style.getPropertyValue('--chat-height')).toBe('420px');
    expect(style.getPropertyValue('--chat-top')).toBe('70px');
    viewport.scale = 2;
    viewport.height = 210;
    viewport.dispatchEvent(new Event('resize'));
    expect(style.getPropertyValue('--chat-height')).toBe('420px');
    fixture.destroy();
    viewport.scale = 1;
    viewport.height = 812;
    viewport.dispatchEvent(new Event('resize'));
    expect(style.getPropertyValue('--chat-height')).toBe('420px');
  });

  it('leaves sizing to CSS when the visual viewport API is unavailable', () => {
    vi.stubGlobal('visualViewport', undefined);
    TestBed.configureTestingModule({ imports: [TestChat] });
    const fixture = TestBed.createComponent(TestChat);
    fixture.detectChanges();
    expect(fixture.nativeElement.firstElementChild.style.getPropertyValue('--chat-height')).toBe('');
  });
});
