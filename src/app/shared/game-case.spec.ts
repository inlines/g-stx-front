import {describe,it,expect} from 'vitest';
import {gameCase} from './game-case';
describe('Platform shelf cases',()=>{
 it('frames all supported physical platforms but never digital games',()=>{
  for(const p of [7,8,9,32,38,48,167]){expect(gameCase(p,'europe',Date.UTC(2005,0,1),'Game').style).not.toBe('none');expect(gameCase(p,'europe',Date.UTC(2005,0,1),'Game',true).style).toBe('none');}
  expect(gameCase(999,'europe',0,'Game').style).toBe('none');
 });
 it('distinguishes Saturn regional shapes and PS1 longboxes',()=>{
  expect(gameCase(32,'japan',null,'Game').jewel).toBe(true);expect(gameCase(32,'america',null,'Game').jewel).toBe(false);
  expect(gameCase(7,'america',Date.UTC(1995,10,1),'Game').style).toBe('ps1-long');expect(gameCase(7,'europe',Date.UTC(1995,10,1),'Game').style).toBe('ps1-pal');
  expect(gameCase(7,'america',null,'Game').style).toBe('ps1');
 });
 it('keeps date heuristics regional and avoids budget-edition inference',()=>{
  expect(gameCase(8,'europe',Date.UTC(2005,0,1),'Game').style).toBe('ps2-pal');expect(gameCase(8,'america',Date.UTC(2005,0,1),'Game').style).toBe('ps2');
  expect(gameCase(38,'europe',Date.UTC(2008,0,1),'Game').style).toBe('psp-early');expect(gameCase(38,'europe',Date.UTC(2010,0,1),'Game').style).toBe('psp');
  expect(gameCase(48,'america',Date.UTC(2020,0,1),'Game').style).toBe('ps4');
 });
});
