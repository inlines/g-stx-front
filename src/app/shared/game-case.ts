import {caseRegion, ps3CaseStyle} from './ps3-case';
export interface GameCase { style:string; brand:string; spine:string; jewel:boolean; }
/** Shelf styling, not a claim about a particular print run or budget edition. */
export function gameCase(platform:number|null|undefined,region:string|number|null|undefined,date:number|null|undefined,name:string,digital=false):GameCase {
 const plain={style:'none',brand:'',spine:'',jewel:false};
 if(digital)return plain;
 const market=caseRegion(region), pal=market==='europe'||market==='australia';
 const ms=date!=null && Number.isFinite(date) ? (date<100000000000 ? date*1000 : date) : null;
 if(platform===9){const style=ps3CaseStyle(platform,region,date,name);return {style,brand:style==='legacy'?'PLAYSTATION 3':'PS3',spine:'PS3',jewel:false};}
 if(platform===7){
  const longbox=market==='america' && ms!=null && ms<Date.UTC(1996,6,1);
  return {style:longbox?'ps1-long':pal?'ps1-pal':market==='japan'?'ps1-japan':'ps1',brand:'PlayStation',spine:'PS',jewel:!longbox};
 }
 if(platform===32)return {style:market==='japan'?'saturn-japan':market==='america'?'saturn-us':pal?'saturn-pal':'saturn',brand:'SEGA SATURN',spine:'SEGA',jewel:market==='japan'||market==='unknown'};
 if(platform===8)return {style:pal && ms!=null && ms>=Date.UTC(2002,0,1)?'ps2-pal':'ps2',brand:'PlayStation 2',spine:'PS2',jewel:false};
 if(platform===38)return {style:ms==null?'psp':ms<Date.UTC(2009,9,1)?'psp-early':'psp',brand:'PSP',spine:'PSP',jewel:false};
 if(platform===48)return {style:'ps4',brand:'PS4',spine:'PS4',jewel:false};
 if(platform===167)return {style:'ps5',brand:'PS5',spine:'PS5',jewel:false};
 return plain;
}
