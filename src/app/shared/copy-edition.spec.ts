import { copyEdition } from './copy-edition';
describe('Copy edition', () => {
 it('uses the selected serial suffix', () => {
  expect(copyEdition({selected_serial:'BCES-00001/P/UK'})).toBe('platinum');
  expect(copyEdition({selected_serial:'BCES-00001/E'})).toBe('essentials');
 });
 it('uses the explicit edition for shared ordinary codes', () => {
  expect(copyEdition({selected_serial:'BLES-00615',selected_edition:'platinum'})).toBe('platinum');
  expect(copyEdition({selected_serial:'BLES-00615'})).toBeNull();
  expect(copyEdition({})).toBeNull();
 });
});
