import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Store } from '@ngxs/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { PersonalLibraryComponent } from './personal-library.component';
import { LibraryViewService } from '@app/shared/library-view.service';
import { LibraryCsvDownload } from '@app/shared/library-csv';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
const items:ICollectionItem[]=Array.from({length:49},(_,i)=>({release_id:i+1,product_id:i+1,product_name:`Game ${i+1}`,platform_id:48,platform_name:'PS4',region_id:1,region_name:'europe',release_date:1000,image_url:null,serial:['CUSA-00001','CUSA-00002'],price:i===0?0:100+i,cib:null}));
describe('Personal library server pages',()=>{
 let fixture:ComponentFixture<PersonalLibraryComponent>, http:HttpTestingController, store:Store;
 beforeEach(()=>{
  vi.useFakeTimers();vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  TestBed.configureTestingModule({imports:[PersonalLibraryComponent],providers:TEST_PROVIDERS});http=TestBed.inject(HttpTestingController);store=TestBed.inject(Store);
  const state=store.snapshot();store.reset({...state,Collection:{...state.Collection,collectionParams:{cat:48},wishlistParams:{cat:48},wtsParams:{cat:48}}});
 });
 afterEach(()=>{fixture?.destroy();http.verify({ignoreCancelled:true});vi.useRealTimers();vi.restoreAllMocks();});
 function pending(kind='collection'){vi.advanceTimersByTime(1);return http.expectOne(r=>r.url===`/api/library/${kind}`);}
 function flush(req:ReturnType<typeof pending>, data=items, total=data.length){const offset=Number(req.request.params.get('offset'));const limit=Number(req.request.params.get('limit'));req.flush({items:data.slice(offset,offset+limit),total_count:total,unfiltered_total:total,platform_ids:[48],owned_regions:{europe:total}});fixture.detectChanges();}
 function mount(kind:'collection'|'wishlist'|'wts'='collection'){fixture=TestBed.createComponent(PersonalLibraryComponent);fixture.componentRef.setInput('kind',kind);fixture.detectChanges();const req=pending(kind);expect(req.request.params.get('limit')).toBe('24');flush(req);return fixture.componentInstance;}
 const cards=()=>fixture.nativeElement.querySelectorAll('app-release-card');
 it('requests just the selected page and clamps an emptied last page',()=>{
  const c=mount();expect(cards()).toHaveLength(24);c.page(3);const req=pending();expect(req.request.params.get('offset')).toBe('48');flush(req);expect(cards()).toHaveLength(1);
  c.retry();flush(pending(),items.slice(0,48));const clamped=pending();expect(clamped.request.params.get('offset')).toBe('24');flush(clamped,items.slice(0,48));expect(cards()).toHaveLength(24);expect(c.view.page).toBe(2);
 });
 it('sends global search, serial mode, regions and sort to the server, resetting the page',()=>{
  const c=mount();c.page(2);flush(pending());c.query.setValue('Game 49');vi.advanceTimersByTime(251);const req=pending();expect(req.request.params.get('query')).toBe('Game 49');expect(req.request.params.get('offset')).toBe('0');req.flush({items:[items[48]],total_count:1,unfiltered_total:49,platform_ids:[48],owned_regions:{}});fixture.detectChanges();expect(cards()).toHaveLength(1);
  c.toggleRegion('europe');flush(pending());c.sort('price');const sorted=pending();expect(sorted.request.params.get('sort')).toBe('price');flush(sorted);c.searchMode('serial');const serial=pending();expect(serial.request.params.get('regions')).toBe('');expect(serial.request.params.get('search_mode')).toBe('serial');flush(serial);
 });
 it('cancels stale page requests and restores page and sort on return',()=>{
  const c=mount();c.page(2);const old=pending();c.page(3);const next=pending();expect(old.cancelled).toBe(true);flush(next);c.sort('date');flush(pending());c.page(2);flush(pending());fixture.destroy();
  fixture=TestBed.createComponent(PersonalLibraryComponent);fixture.componentRef.setInput('kind','collection');fixture.detectChanges();const restored=pending();expect(restored.request.params.get('sort')).toBe('date');expect(restored.request.params.get('offset')).toBe('24');flush(restored);
 });
 it('resets page on platform switch',()=>{const c=mount();c.page(2);flush(pending());c.selectPlatform(167);const req=pending();expect(req.request.params.get('cat')).toBe('167');expect(req.request.params.get('offset')).toBe('0');flush(req);});
 for(const kind of ['wishlist','wts'] as const)it(`paginates ${kind} and exposes its own menu actions`,()=>{
  const c=mount(kind);c.page(3);flush(pending(kind));expect(cards()).toHaveLength(1);fixture.nativeElement.querySelector('.edit-button').click();fixture.detectChanges();const text=fixture.nativeElement.querySelector('.context-menu').textContent;
  expect(text).toContain(kind==='wts'?'Снять с продажи':'Удалить из вишлиста');expect(text).not.toContain('Удалить из коллекции');expect(fixture.nativeElement.querySelector('.ownership-mark')).toBeNull();
 });
 it('prepopulates copy details and saves false separately from unknown, with the selected release serial',()=>{
  const c=mount();c.editCopy(items[0]);fixture.detectChanges();expect(c.copyCib.value).toBeNull();expect(c.copySerial.value).toBeNull();c.copyCib.setValue(false);c.copySerial.setValue('CUSA-00002');c.saveCopy();const req=http.expectOne('/api/collection-copy');expect(req.request.body).toEqual({release_id:1,selected_serial:'CUSA-00002',cib:false});req.flush(null);http.expectOne('/api/collection-stats').flush([]);flush(pending());expect(document.querySelector('.modal')).toBeNull();
 });
 it('keeps the copy editor open after failed validation',()=>{const c=mount();c.editCopy(items[0]);c.saveCopy();http.expectOne('/api/collection-copy').flush('wrong serial',{status:400,statusText:'Bad Request'});fixture.detectChanges();expect(document.querySelector('.modal')).not.toBeNull();http.expectNone(r=>r.url==='/api/library/collection');});
 it('saves a zero purchase price without touching copy fields',()=>{const c=mount();c.edit(items[0]);expect(c.price.value).toBe(0);c.savePrice();const req=http.expectOne('/api/set_release_price');expect(req.request.body).toEqual({release_id:1,price:0});req.flush(null);http.expectOne('/api/collection-stats').flush([]);flush(pending());});
 it('validates sale prices and preserves a zero price and false CIB',()=>{const c=mount('wts');c.editSale({...items[0],cib:false});expect(c.salePrice.value).toBe(0);c.salePrice.setValue(-1);c.saveSale();http.expectNone('/api/add_wts');c.salePrice.setValue(0);c.saveSale();const req=http.expectOne('/api/add_wts');expect(req.request.body).toEqual({release_id:1,price:0,cib:false});req.flush(null);http.expectOne('/api/collection-stats').flush([]);flush(pending('wts'));});
 it('withdraws only the sale flag and retries failures',()=>{const c=mount('wts');c.remove(1);http.expectOne('/api/remove_wts').flush(null);http.expectOne('/api/collection-stats').flush([]);flush(pending('wts'));c.retry();pending('wts').flush('',{status:500,statusText:'Error'});fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Не удалось загрузить');c.retry();flush(pending('wts'));});
 for(const kind of ['collection','wishlist','wts'] as const)it(`fetches the whole ${kind} only when exporting CSV`,async()=>{
  const c=mount(kind);const save=vi.spyOn(TestBed.inject(LibraryCsvDownload),'save').mockImplementation(()=>{});const promise=c.exportCsv();const req=http.expectOne(r=>r.url===`/api/library/${kind}`);expect(req.request.params.get('limit')).toBe('1000');flush(req);await promise;expect(save).toHaveBeenCalledOnce();expect(save.mock.calls[0][0]).toContain('Game 49');
 });
 it('opens the animation with only this page',async()=>{const c=mount();c.page(3);flush(pending());const modal={componentInstance:{items:[] as ICollectionItem[]},close:vi.fn(),result:new Promise(()=>{})};vi.spyOn(TestBed.inject(NgbModal),'open').mockReturnValue(modal as never);await c.openSnow();expect(modal.componentInstance.items.map(i=>i.release_id)).toEqual([49]);});
});
