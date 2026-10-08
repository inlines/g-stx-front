import {TestBed} from '@angular/core/testing';
import {describe,it,expect} from 'vitest';
import {GameCoverComponent} from './game-cover.component';
describe('Game cover',()=>{
 it('keeps the box when its image fails and recovers with a new source',async()=>{
 await TestBed.configureTestingModule({imports:[GameCoverComponent]}).compileComponents();
 const f=TestBed.createComponent(GameCoverComponent);
 f.componentRef.setInput('platform',9);f.componentRef.setInput('region','america');f.componentRef.setInput('name','Murdered: Soul Suspect');f.componentRef.setInput('src','one.jpg');f.detectChanges();
 expect(f.nativeElement.querySelector('.blue')).not.toBeNull();
 f.nativeElement.querySelector('img').dispatchEvent(new Event('error'));f.detectChanges();
 expect(f.nativeElement.querySelector('.empty')).not.toBeNull();expect(f.nativeElement.querySelector('.box')).not.toBeNull();
 f.componentRef.setInput('src','two.jpg');f.detectChanges();expect(f.nativeElement.querySelector('img').getAttribute('src')).toBe('two.jpg');
 f.componentRef.setInput('platform',38);f.detectChanges();expect(f.nativeElement.querySelector('.brand')).toBeNull();
 });
});
