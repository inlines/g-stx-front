export type PageItem = number | '...';

export function buildPages(total: number, current: number, range: number): PageItem[] {
  if (total < 1) return [];
  const visible = new Set([1, total]);
  for (let page = Math.max(1, current - range); page <= Math.min(total, current + range); page++)
    visible.add(page);
  const result: PageItem[] = [];
  let previous = 0;
  for (const page of [...visible].sort((a, b) => a - b)) {
    if (previous && page - previous > 1) result.push('...');
    result.push(page);
    previous = page;
  }
  return result;
}
