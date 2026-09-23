import { Component, input } from '@angular/core';
@Component({
  selector: 'app-nav-icon',
  template: `<svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="paths[name()]" />
  </svg>`,
  styles: [':host { display:inline-flex; flex-shrink:0; }'],
})
export class NavIconComponent {
  readonly name = input<keyof typeof this.paths>('catalog');
  readonly paths = {
    catalog: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    photo: 'M8 5l2-2h4l2 2h4a1 1 0 0 1 1 1v14H3V6a1 1 0 0 1 1-1z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    players:
      'M10 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M20 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M1 21v-3a6 6 0 0 1 12 0v3 M15 13a6 6 0 0 1 8 5v3',
    mine: 'M4 4h16v17H4z M8 1v6 M16 1v6 M8 12h8 M8 16h5',
    chat: 'M21 11a9 8 0 0 1-9 8c-1.5 0-3-.3-4.3-.9L3 21l1.2-5A7.4 7.4 0 0 1 3 11a9 8 0 1 1 18 0z',
    more: 'M4 11h2v2H4z M11 11h2v2h-2z M18 11h2v2h-2z',
  };
}
