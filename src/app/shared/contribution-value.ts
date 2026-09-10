export function normalizeAlternativeName(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}
export function validAlternativeName(value: string): boolean {
  const length = [...value].length;
  return length >= 1 && length <= 200 && !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
}
