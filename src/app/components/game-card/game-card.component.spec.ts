import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {describe,it,expect} from 'vitest';
import {GameCardComponent} from './game-card.component';
describe('Unreleased game cards',()=>{
 it('marks unreleased cards, preserves clicks, and does not mistake an unknown date for cancellation',async()=>{
  await TestBed.configureTestingModule({imports:[GameCardComponent],providers:[provideRouter([])]}).compileComponents();
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
