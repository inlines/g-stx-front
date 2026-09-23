import { TestBed } from '@angular/core/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { ReleaseCardComponent } from './release-card.component';
const item={release_id:1,product_id:1,product_name:'Game',platform_id:48,platform_name:'PS4',region_name:'europe',release_date:null,image_url:null,serial:['CUSA-00001','CUSA-00002'],selected_serial:null,cib:null,price:0,purchase_price:0};
describe('Release card gestures and copy data',()=>{
 beforeEach(()=>{vi.useFakeTimers();TestBed.configureTestingModule({imports:[ReleaseCardComponent],providers:TEST_PROVIDERS});});
 afterEach(()=>{vi.useRealTimers();});
 function setup(readOnly=false){const f=TestBed.createComponent(ReleaseCardComponent);f.componentRef.setInput('item',{...item});f.componentRef.setInput('collection',true);f.componentRef.setInput('readOnly',readOnly);f.detectChanges();return f;}
 function down(target:HTMLElement){return {pointerType:'touch',isPrimary:true,clientX:10,clientY:10,target} as unknown as PointerEvent;}
 it('opens on a stationary long press, cancels on movement and suppresses only the resulting click',()=>{
  const f=setup(),c=f.componentInstance,a=f.nativeElement.querySelector('a');c.beginHold(down(a));c.moveHold({...down(a),clientX:30});vi.advanceTimersByTime(600);expect(c.menuOpen).toBe(false);
  c.beginHold(down(a));vi.advanceTimersByTime(550);expect(c.menuOpen).toBe(true);c.cancelHold();const click=new MouseEvent('click',{bubbles:true,cancelable:true});a.dispatchEvent(click);expect(click.defaultPrevented).toBe(true);c.closeMenu();c.beginHold(down(a));c.cancelHold();expect(c.menuOpen).toBe(false);f.destroy();
 });
 it('does not expose any editing or ownership mark on someone else’s card',()=>{const f=setup(true);f.componentInstance.beginHold(down(f.nativeElement));vi.advanceTimersByTime(1000);f.detectChanges();expect(f.componentInstance.menuOpen).toBe(false);expect(f.nativeElement.querySelector('.edit-button,.incomplete,.ownership-mark')).toBeNull();f.destroy();});
 it('shows a selected serial and zero purchase price; false CIB is known data',()=>{const f=setup();expect(f.nativeElement.querySelector('.incomplete')).not.toBeNull();f.componentRef.setInput('item',{...item,selected_serial:'CUSA-00002',cib:false});f.detectChanges();expect(f.nativeElement.querySelector('.incomplete')).toBeNull();expect(f.nativeElement.textContent).toContain('CUSA-00002');expect(f.nativeElement.textContent).not.toContain('CUSA-00001');expect(f.nativeElement.textContent).toContain('Неполный комплект');expect(f.nativeElement.querySelector('.price').textContent).toContain('0');f.destroy();});
});
