import { GameCoverComponent } from '../game-cover/game-cover.component';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { GameStatsComponent } from '../game-stats/game-stats.component';
import { SerialListComponent } from '../serial-list/serial-list.component';
@Component({selector:'app-game-card',imports:[GameCoverComponent,RouterLink,DatePipe,GameStatsComponent,SerialListComponent],changeDetection:ChangeDetectionStrategy.OnPush,
 template:`<article class="game-card" [class.unreleased]="game.is_released === false" [routerLink]="link">
   @if(game.is_released === false){<div class="unreleased-shade" aria-label="Игра не вышла"><span>UNRELEASED</span></div>}
   <ng-content select="[card-badges]"/>
   @if(owned){<span class="ownership-mark" role="img" aria-label="В вашей коллекции"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></span>}
   @if(showMissing){<span class="missing-serial" aria-label="Серийники пока не указаны">?</span>}
   <a class="catalog-cover" [routerLink]="link" [attr.aria-label]="game.name">
     <app-game-cover [src]="game.image_url" [name]="game.name" [platform]="platform ?? link?.[2]?.platform" [region]="region" [date]="game.release_date" [digital]="game.digital_only ?? false" [priority]="priority"/>
   </a>
   <div class="game-content">
     <a class="title" [title]="game.name" [routerLink]="link">{{game.name}}</a>
     <app-game-stats [game]="game"/>
     @if(game.serial?.length){<app-serial-list [serials]="game.serial"/>}
     @else if(showMissing){<a class="missing-hint" [routerLink]="link">Знаете серийник? Дополните →</a>}
     <div class="game-first-release">{{game.release_date != null ? 'с ' + (game.release_date | date:'dd.MM.yy':'UTC') : 'Дата неизвестна'}}</div>
     <ng-content/>
   </div>
 </article>`,styleUrl:'./game-card.component.scss'})
export class GameCardComponent {
 @Input() platform:number|null|undefined;
 @Input() region:string|number|null|undefined;
 @Input({required:true}) game!: IProductListItem;
 @Input({required:true}) link!: any[];
 @Input() priority=false;
 @Input() owned=false;
 @Input() missing=false;
 get showMissing(){return !this.game.digital_only && this.game.is_released !== false && (this.game.is_released === true || this.game.release_date == null || this.game.release_date <= Date.now()) && (this.missing || (this.game.has_serials === false || (this.game.serial != null && !this.game.serial.length)));}
}
