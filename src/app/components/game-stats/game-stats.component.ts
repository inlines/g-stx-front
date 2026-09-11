import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
@Component({
  selector: 'app-game-stats',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="stats">
    @if (game.total_rating != null) {
      <span
        class="rating"
        [title]="
          'общий рейтинг пользователей и критиков. Оценок: ' + (game.total_rating_count ?? 'нет данных')
        "
        >★ {{ game.total_rating | number: '1.0-1' }}<small>/100 </small></span
      >
    } @else {
      <span class="unknown"> нет оценки</span>
    }
    @if (showMultiplayer) {
      @if (game.local_players || game.local_multiplayer) {
        <span
          >Локально: {{ game.local_players ? 'до ' + game.local_players : 'есть, лимит неизвестен' }}</span
        >
      }
      @if (game.online_players || game.online_multiplayer) {
        <span
          >Онлайн: {{ game.online_players ? 'до ' + game.online_players : 'есть, лимит неизвестен' }}</span
        >
      }
      @if (
        !game.local_players && !game.online_players && !game.local_multiplayer && !game.online_multiplayer
      ) {
        <span class="unknown">Мультиплеер · нет данных</span>
      }
    }
  </div>`,
  styles: `
    :host {
      display: block;
      margin-top: 10px;
    }
    .stats {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      font-size: 12px;
      line-height: 1.4;
    }
    .stats > span {
      padding: 4px 7px;
      background: #182536;
      border-radius: 6px;
      color: #c5daed;
      max-width: 100%;
      overflow-wrap: anywhere;
    }
    .stats > .rating {
      background: #392f1e;
      color: #ffe099;
      font-weight: 700;
    }
    .rating small {
      margin-left: 4px;
      font-weight: 400;
    }
    .stats > .unknown {
      color: #a4b1c0;
    }
  `,
})
export class GameStatsComponent {
  @Input({ required: true }) game!: IProductListItem;
  @Input() showMultiplayer = true;
}
