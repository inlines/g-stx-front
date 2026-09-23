import { CdkTrapFocus } from '@angular/cdk/a11y';
import { MobilePageLockDirective } from '@app/directives/mobile-page-lock.directive';
import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ElementRef, ViewChild, inject, DestroyRef, signal } from '@angular/core';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { GameCardComponent } from '../game-card/game-card.component';
@Component({selector:'app-release-card',imports:[GameCardComponent,CurrencyPipe,CdkTrapFocus,MobilePageLockDirective],templateUrl:'./release-card.component.html',styleUrl:'./release-card.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class ReleaseCardComponent {
 @Input({required:true}) item!:ICollectionItem;
 @Input() platform:number|null=null;
 @Input() collection=false;
 @Input() priority=false;
 @Input() readOnly=false;
 @Input() saleMode=false;
 @Input() forSale=false;
 @Input() busy=false;
 @Output() editSale=new EventEmitter<ICollectionItem>();
 @Output() toggleSale=new EventEmitter<ICollectionItem>();
 @Output() editPrice=new EventEmitter<ICollectionItem>();
 @Output() editCopy=new EventEmitter<ICollectionItem>();
 @Output() removeRelease=new EventEmitter<number>();
 @ViewChild('editButton') editButton?:ElementRef<HTMLButtonElement>;
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
 private readonly opened=signal(false);
 get menuOpen(){return this.opened();}
 private timer?:ReturnType<typeof setTimeout>;
 private start?:{x:number;y:number};
 private suppress=false;
 constructor(){
   const click=(e:MouseEvent)=>{if(this.suppress){this.suppress=false;e.preventDefault();e.stopImmediatePropagation();}};
   this.host.addEventListener('click',click,true);
   inject(DestroyRef).onDestroy(()=>{this.cancelHold();this.host.removeEventListener('click',click,true);});
 }
 get productLink(){const platform=this.item.platform_id??this.platform;return platform==null?['/products',this.item.product_id]:['/products',this.item.product_id,{platform}];}
 get game(){return {...this.item,id:this.item.product_id,name:this.item.product_name,first_release_date:null,alternative_names:this.item.alternative_names??null,serial:this.item.selected_serial?[this.item.selected_serial]:this.item.serial};}
 get purchasePrice(){return this.item.purchase_price!==undefined?this.item.purchase_price:this.collection?this.item.price:null;}
 get incomplete(){return this.item.cib==null || (!this.item.digital_only && (this.item.serial?.length??0)>1 && !this.item.selected_serial);}
 openMenu(){if(!this.readOnly&&!this.busy)this.opened.set(true);}
 closeMenu(){this.opened.set(false);this.editButton?.nativeElement.focus({preventScroll:true});}
 beginHold(e:PointerEvent){this.suppress=false;this.cancelHold();if(this.readOnly||this.busy||e.pointerType==='mouse'||!e.isPrimary||(e.target as HTMLElement).closest('button,summary,input,select'))return;this.start={x:e.clientX,y:e.clientY};this.timer=setTimeout(()=>{this.suppress=true;this.openMenu();},550);}
 moveHold(e:PointerEvent){if(this.start&&Math.hypot(e.clientX-this.start.x,e.clientY-this.start.y)>10)this.cancelHold();}
 cancelHold(){clearTimeout(this.timer);this.timer=undefined;this.start=undefined;}
 context(e:Event){if(!this.readOnly&&window.innerWidth<768){e.preventDefault();}}
}
