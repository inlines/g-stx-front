import {cardColumns,responsivePageSize} from './responsive-page-size';
describe('viewport page capacity',()=>{
 it('uses complete rows at every breakpoint',()=>{for(const w of [320,575,576,991,992,1199,1200,1599,1600,1920,2560]){const n=responsivePageSize(w,1080);expect(n%cardColumns(w)).toBe(0);expect(n).toBeGreaterThan(0);expect(n).toBeLessThanOrEqual(96);}});
 it('fills taller viewports and respects guest API limits',()=>{expect(responsivePageSize(1440,2160)).toBeGreaterThan(responsivePageSize(1440,800));for(const w of [390,1024,1440,1920]) expect(responsivePageSize(w,3000,20)).toBeLessThanOrEqual(20);});
});
