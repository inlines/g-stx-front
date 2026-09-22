import { Component } from '@angular/core';
@Component({
  selector: 'app-spine-guide',
  template: `<figure>
    <svg
      viewBox="0 0 340 190"
      role="img"
      aria-label="Торец коробки прямо перед камерой, серийник крупно и без бликов"
    >
      <rect x="87" y="10" width="66" height="168" rx="5" fill="#182e41" stroke="#abc4d8" stroke-width="2" />
      <path d="M153 10 171 22V169L153 178" fill="#304b61" stroke="#abc4d8" />
      <text x="120" y="44" text-anchor="middle" fill="white" font-size="12">ИГРА</text>
      <rect
        x="94"
        y="112"
        width="52"
        height="50"
        rx="4"
        fill="#071822"
        stroke="#bba0e4"
        stroke-dasharray="4 3"
      />
      <text x="120" y="132" text-anchor="middle" fill="white" font-size="12">BLES</text>
      <text x="120" y="149" text-anchor="middle" fill="white" font-size="12">00072</text>
      <path d="M185 132h25" stroke="#bba0e4" stroke-width="2" />
      <text x="218" y="129" fill="#d6e3ef" font-size="12">Код целиком</text>
      <text x="218" y="147" fill="#abc4d8" font-size="11">Буквы + цифры</text>
    </svg>
    <figcaption>
      Снимайте торец прямо, крупно и без бликов. Буквы и цифры кода должны целиком попасть в кадр. Форма
      коробки не важна.
    </figcaption>
  </figure>`,
  styles: [
    `
      figure {
        margin: 0;
      }
      svg {
        display: block;
        width: 100%;
        max-width: 340px;
        margin: auto;
      }
      figcaption {
        color: #abc4d8;
        font-size: 0.9rem;
        line-height: 1.5;
      }
    `,
  ],
})
export class SpineGuideComponent {}
