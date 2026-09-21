export type SearchMode = 'name' | 'serial';
export const SERIAL_FORMAT = /^(?:[A-Z]{4}-[0-9]{5}(?:[A-Z]{1,4}|(?:[-/][A-Z0-9]{1,8}){1,3})?|LSP-[0-9]{6}|T-[0-9]{3,5}[GH](?:-[0-9]{2})?|GS-[0-9]{4}|MK-[0-9]{5}(?:-[0-9]{2})?|[0-9]{5}(?:-[0-9]{2})?)$/;
export const SERIAL_HINT =
  'Формат: CUSA-12345, GS-9001, T-3101G, MK-81005, можно без дефиса. Суффиксы /ANZ, /H/ITA или GH сохраняются. Поиск — по полному номеру.';
export function canonicalSerial(value: string): string {
  return value
    .replace(/\s/g, '')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/[a-z]/g, (c) => c.toUpperCase())
    .replace(/^([A-Z]{4})-?([0-9]{5})(.*)$/, '$1-$2$3')
    .replace(/^LSP-?([0-9]{6})$/, 'LSP-$1')
    .replace(/^(T|GS|MK)-?([0-9].*)$/, '$1-$2');
}
export function validSerial(value: string): boolean {
  return SERIAL_FORMAT.test(canonicalSerial(value));
}
/** Do not reinterpret damaged legacy records as real serials. */
export function displaySerials(values: readonly string[] | null | undefined): string[] {
  return [
    ...new Set(
      (values ?? [])
        .filter(Boolean)
        .map((value) => (validSerial(value) ? canonicalSerial(value) : value.trim()))
        .filter(Boolean),
    ),
  ];
}
