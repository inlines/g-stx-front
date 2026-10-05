/** Matches the shared card grid breakpoints. Always request complete rows. */
export function cardColumns(width: number): number {
  return width >= 1200 ? 5 : width >= 992 ? 4 : width >= 576 ? 3 : 2;
}
export function responsivePageSize(width = window.innerWidth, height = window.innerHeight, max = 96): number {
  if (width < 576) return Math.min(8, max);
  const columns = cardColumns(width);
  const containerWidth = width >= 1400 ? 1320 : width >= 1200 ? 1140 : width >= 992 ? 960 : width;
  const cardWidth = Math.max(120, (containerWidth - (width < 768 ? Math.max(24, width * 0.06) : 24) - (columns - 1) * 16) / columns);
  const rows = Math.max(2, Math.ceil(Math.max(0, height - 180) / (cardWidth * 4 / 3 + 230 + 16)));
  return columns * Math.max(1, Math.min(rows, Math.floor(max / columns)));
}
