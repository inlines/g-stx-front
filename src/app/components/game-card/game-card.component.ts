import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { GameStatsComponent } from '../game-stats/game-stats.component';
import { SerialListComponent } from '../serial-list/serial-list.component';
@Component({selector:'app-game-card',imports:[RouterLink,DatePipe,GameStatsComponent,SerialListComponent],changeDetection:ChangeDetectionStrategy.OnPush,
 template:`<article class="game-card" [routerLink]="link">
   <ng-content select="[card-badges]"/>
   @if(owned){<span class="ownership-mark" role="img" aria-label="В вашей коллекции"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></span>}
   @if(missing){<span class="missing-serial" aria-label="Серийники пока не указаны">?</span>}
   <a class="catalog-cover" [routerLink]="link" [attr.aria-label]="game.name">
     @if(game.image_url && game.image_url !== failedSource){<img [src]="game.image_url" [alt]="game.name" loading="eager" decoding="sync" [attr.fetchpriority]="priority?'high':'auto'" (error)="failedSource=game.image_url">}
     @else{<span class="no-cover">Нет изображения</span>}
   </a>
   <div class="game-content">
     <a class="title" [routerLink]="link">{{game.name}}</a>
     <app-game-stats [game]="game"/>
     @if(game.serial?.length){<app-serial-list [serials]="game.serial"/>}
     @else if(missing){<a class="missing-hint" [routerLink]="link">Знаете серийник? Дополните →</a>}
     <div class="game-first-release">{{game.release_date != null ? 'с ' + (game.release_date | date:'dd.MM.yy':'UTC') : 'Дата выхода не указана'}}</div>
     <ng-content/>
   </div>
 </article>`,styleUrl:'./game-card.component.scss'})
export class GameCardComponent {
 failedSource:string|null=null;
 @Input({required:true}) game!: IProductListItem;
 @Input({required:true}) link!: any[];
 @Input() priority=false;
 @Input() owned=false;
 @Input() missing=false;
}
