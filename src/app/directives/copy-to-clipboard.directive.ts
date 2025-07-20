import { Directive, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

@Directive({
  selector: '[appCopyToClipboard]',
  standalone: true,
})
export class CopyToClipboardDirective implements OnInit {

  constructor(
    private renderer:Renderer2,
    private element:ElementRef,
    private clipboard: Clipboard
  ) { }

  @HostListener('click') onClick() {
    console.warn('click');
    this.clipboard.copy(this.nativeElement.textContent?.trim() || '');
  }

  private nativeElement! : Node;

  public ngOnInit(): void {
    this.nativeElement = this.element.nativeElement;
    const totalString =
      `<svg fill="currentColor" focusable="false" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24">
        <g>
        <rect fill="none" height="24" width="24">
        </rect>
        </g>
        <g>
        <path d="M16,20H5V6H3v14c0,1.1,0.9,2,2,2h11V20z M20,16V4c0-1.1-0.9-2-2-2H9C7.9,2,7,2.9,7,4v12c0,1.1,0.9,2,2,2h9 C19.1,18,20,17.1,20,16z M18,16H9V4h9V16z">
        </path>
        </g>
      </svg>`;
    const button= this.renderer.createElement('span');
    button.style = 'height:20px;line-height:20px;width:20px;cursor:pointer;'
    button.innerHTML = totalString;
    this.renderer.appendChild(this.nativeElement, button);
    this.renderer.nextSibling(this.nativeElement)
  }

}
