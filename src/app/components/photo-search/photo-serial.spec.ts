import { photoSerials, matchingPhotoReleases, releaseRegionGroup, serialPlatform } from './photo-serial';
import { IReleaseItem } from '@app/states/products/interfaces/release-item.interface';
describe('Printed box serial recognition', () => {
  it('joins the two lines on the supplied spine without appending the packaging number', () => {
    expect(photoSerials('Sigma\nBLES\n00072\n0030961')).toEqual(['BLES-00072']);
  });
  it('supports Saturn serials and suffixes without inventing prefixes', () => {
    expect(photoSerials('T-3101G GS-9001 MK-81005-50 81005')).toEqual([
      'T-3101G',
      'GS-9001',
      'MK-81005-50',
      '81005',
    ]);
    expect(photoSerials('BCES-00797/S')).toEqual(['BCES-00797/S']);
  });
  it('does not guess OCR substitutions or turn EAN digits into serials', () => {
    expect(photoSerials('BLES O0072 5021290030961')).toEqual([]);
    expect(serialPlatform('SCES-00001')).toBeNull();
    expect(serialPlatform('00072')).toBeNull();
  });
  it('uses exact release serial and platform, never another regional row', () => {
    const rows = [
      { platform_id: 9, release_region: 'europe', serial: ['BLES-00072'] },
      { platform_id: 9, release_region: 'north_america', serial: ['BLUS-30036'] },
      { platform_id: 48, release_region: 'japan', serial: ['BLES-00072'] },
    ] as IReleaseItem[];
    expect(matchingPhotoReleases(rows, 'BLES00072', 9)).toEqual([rows[0]]);
    expect(releaseRegionGroup('north america')).toBe('america');
    expect(releaseRegionGroup('worldwide')).toBe('other');
  });
});
