import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {caseRegion} from '../../shared/ps3-case';
import {gameCase} from '../../shared/game-case';
@Component({selector:'app-game-cover',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,
 template:`<span class="cover" [class.digital]="digital" [class.box]="style !== 'none'" [class.legacy]="style === 'legacy'" [class.blue]="style === 'blue'" [class.jewel]="!digital && frame.jewel" [attr.data-case]="style" [attr.data-edition]="budgetEdition" [attr.data-region]="market">
 @if(style !== 'none'){<span class="spine" aria-hidden="true"><span class="spine-logo">{{frame.spine}}</span><span class="spine-title">{{name}}</span></span><span class="rim" aria-hidden="true">{{rim}}</span><span class="brand" aria-hidden="true">{{frame.brand}}</span>@if(budgetEdition){<span class="edition-label" aria-hidden="true">{{budgetEdition === 'platinum' ? 'PLATINUM' : 'ESSENTIALS'}}</span>}}
 @if(digital){<span class="digital-label">digital_only</span>}<span class="art">@if(src && failed !== src){@for(coverSource of [src]; track coverSource){<img [src]="coverSource" [alt]="name" [attr.loading]="priority ? 'eager' : 'lazy'" decoding="sync" [attr.fetchpriority]="priority ? 'high' : 'auto'" (error)="failed = coverSource"/>}}@else{<span class="empty">Нет изображения</span>}</span></span>`,
 styleUrl:'./game-cover.component.scss'})
export class GameCoverComponent {
 @Input() src:string|null|undefined; @Input() name=''; @Input() platform:number|null|undefined;
 @Input() region:string|number|null|undefined; @Input() date:number|null|undefined; @Input() digital=false; @Input() priority=false;
 @Input() edition:string|null|undefined;
 get budgetEdition(){return !this.digital && [7,8,9,38].includes(this.platform ?? 0) && (this.edition === 'platinum' || this.edition === 'essentials') ? this.edition : null;}
 failed:string|null|undefined;
 get market(){return caseRegion(this.region);}
 get frame(){const frame=gameCase(this.platform,this.region,this.date,this.name,this.digital);return this.budgetEdition && this.platform===9 ? {...frame,style:'black',brand:'PS3'} : frame;}
 get style(){return this.digital ? 'none' : this.frame.style;}
 get rim(){return this.platform===38?'UMD':this.platform===7||this.platform===32?'COMPACT DISC':this.platform===8?'DVD':'Blu-ray Disc';}
}
