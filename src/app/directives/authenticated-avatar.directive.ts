import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

/** Image elements cannot send the Bearer header; fetch through the API interceptor. */
@Directive({ selector: 'img[authenticatedAvatar]' })
export class AuthenticatedAvatarDirective implements OnChanges, OnDestroy {
  @Input() authenticatedAvatar = '';
  private readonly http = inject(HttpClient);
  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private request?: Subscription;
  private objectUrl?: string;
  ngOnChanges() {
    this.clear();
    if (!this.authenticatedAvatar) return;
    this.request = this.http.get(this.authenticatedAvatar, { responseType: 'blob' }).subscribe({
      next: blob => {
        this.objectUrl = URL.createObjectURL(blob);
        this.image.nativeElement.src = this.objectUrl;
      },
      error: () => this.image.nativeElement.dispatchEvent(new Event('error')),
    });
  }
  private clear() {
    this.request?.unsubscribe();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
    this.image.nativeElement.removeAttribute('src');
  }
  ngOnDestroy() { this.clear(); }
}
