/** Visual approximation, not edition metadata. Dates may overlap between print runs. */
export function caseRegion(value: string|number|null|undefined): string {
 const v=String(value??'').trim().toLowerCase();
 if(['1','europe','eu'].includes(v))return 'europe';
 if(['2','america','north america','north_america','north-america','us','usa'].includes(v))return 'america';
 if(['3','australia','au'].includes(v))return 'australia';
 if(['5','japan','jp'].includes(v))return 'japan';
 return 'unknown';
}
const blueUS=new Set(['the amazing spider-man 2','deception iv: blood ties','drakengard 3','dynasty warriors 8: xtreme legends','everybody dance 3','lego the hobbit','mlb 14: the show','mugen souls z','murdered: soul suspect','rambo: the video game','watch dogs']);
export function ps3CaseStyle(platform:number|null|undefined,region:string|number|null|undefined,date:number|null|undefined,name:string,digital=false): 'none'|'neutral'|'legacy'|'black'|'blue' {
 if(platform!==9 || digital)return 'none';
 const market=caseRegion(region);
 if(market==='unknown')return 'neutral';
 if(market==='america' && blueUS.has(name.trim().toLowerCase()))return 'blue';
 if(date==null || !Number.isFinite(date))return 'neutral';
 const ms=date<100000000000 ? date*1000 : date;
 // Conservative visual transition. Late old-brand releases are explicit exceptions.
 const lateOld=['rogue warrior','tony hawk: ride','tony hawk ride','call of duty: modern warfare 2'];
 const old=ms<Date.UTC(2009,8,1) || (ms<Date.UTC(2010,0,1) && market!=='japan' && lateOld.includes(name.toLowerCase())) || (market==='europe' && name.toLowerCase()==='uncharted 2: among thieves');
 return old?'legacy':'black';
}
