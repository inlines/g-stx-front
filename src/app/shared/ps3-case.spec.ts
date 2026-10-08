import {describe,it,expect} from 'vitest';
import {ps3CaseStyle} from './ps3-case';
describe('PS3 shelf styling',()=>{
 it('does not manufacture a regional edition or physical digital case',()=>{expect(ps3CaseStyle(9,null,1230000000,'Game')).toBe('neutral');expect(ps3CaseStyle(9,'europe',null,'Game')).toBe('neutral');expect(ps3CaseStyle(9,'europe',1230000000,'Game',true)).toBe('none');expect(ps3CaseStyle(38,'europe',1230000000,'Game')).toBe('none');});
 it('uses US blue exceptions rather than a global date interval',()=>{expect(ps3CaseStyle(9,'america',1401753600000,'Murdered: Soul Suspect')).toBe('blue');expect(ps3CaseStyle(9,'europe',1401753600000,'Murdered: Soul Suspect')).toBe('black');expect(ps3CaseStyle(9,'america',1401753600000,'Other game')).toBe('black');});
 it('handles regional transition exceptions and timestamp units',()=>{expect(ps3CaseStyle(9,'europe',1255392000000,'Uncharted 2: Among Thieves')).toBe('legacy');expect(ps3CaseStyle(9,'america',1255392000000,'Uncharted 2: Among Thieves')).toBe('black');expect(ps3CaseStyle(9,'japan',1200000000,'Game')).toBe('legacy');expect(ps3CaseStyle(9,5,1200000000000,'Game')).toBe('legacy');});
});
