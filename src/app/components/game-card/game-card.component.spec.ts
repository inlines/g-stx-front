import { OwnedSerialsService } from '@app/shared/owned-serials.service';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {describe,it,expect} from 'vitest';
import {GameCardComponent} from './game-card.component';
describe('Unreleased game cards',()=>{
 it('marks unreleased cards, preserves clicks, and does not mistake an unknown date for cancellation',async()=>{
  await TestBed.configureTestingModule({imports:[GameCardComponent],providers:[provideRouter([]), {provide: OwnedSerialsService, useValue: {forGame: () => ['BCES-00002']}}]}).compileComponents();
  const f=TestBed.createComponent(GameCardComponent);
  f.componentRef.setInput('link',['/products',1]);
  f.componentRef.setInput('game',{id:1,name:'Cancelled',is_released:false,release_date:null});f.detectChanges();
  expect(f.nativeElement.querySelector('.game-card.unreleased')).not.toBeNull();
  expect(f.nativeElement.querySelector('.unreleased-shade').textContent).toContain('UNRELEASED');
  expect(f.nativeElement.querySelector('a.title').getAttribute('href')).toBe('/products/1');
  f.componentRef.setInput('game',{id:1,name:'Undated',is_released:true,release_date:null});f.detectChanges();
  expect(f.nativeElement.querySelector('.unreleased-shade')).toBeNull();
  expect(f.nativeElement.textContent).toContain('Дата неизвестна');
 });
});

describe('Regional serial badge',()=>{
 it('uses displayed serials and suppresses digital and unreleased badges',async()=>{
  await TestBed.configureTestingModule({imports:[GameCardComponent],providers:[provideRouter([]), {provide: OwnedSerialsService, useValue: {forGame: () => ['BCES-00002']}}]}).compileComponents();
  const f=TestBed.createComponent(GameCardComponent);f.componentRef.setInput('link',['/products',1]);
  const game={id:1,name:'Regional',has_serials:true,serial:[],is_released:true};
  f.componentRef.setInput('game',game);f.detectChanges();expect(f.nativeElement.querySelector('.missing-serial')).not.toBeNull();
  f.componentRef.setInput('game',{...game,serial:['BCES-00001','BCES-00002']});f.detectChanges();
  const owned = f.nativeElement.querySelector('app-serial-list li.owned');
  expect(owned.textContent).toContain('BCES-00002');
  expect(f.nativeElement.querySelectorAll('app-serial-list li.owned')).toHaveLength(1);
  f.componentRef.setInput('game',{...game,digital_only:true});f.detectChanges();expect(f.nativeElement.querySelector('.missing-serial')).toBeNull();
  f.componentRef.setInput('game',{...game,is_released:false});f.detectChanges();expect(f.nativeElement.querySelector('.missing-serial')).toBeNull();
 });
});
