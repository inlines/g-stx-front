/** Matches the shared card grid breakpoints. Always request complete rows. */
export function cardColumns(width: number): number {
  return width >= 1920 ? 8 : width >= 1600 ? 6 : width >= 1200 ? 5 : width >= 992 ? 4 : width >= 576 ? 3 : 2;
}
export function responsivePageSize(width = window.innerWidth, height = window.innerHeight, max = 96): number {
  const columns = cardColumns(width);
  const cardWidth = Math.max(120, (width - (width < 576 ? 24 : 64) - (columns - 1) * 16) / columns);
  const rows = Math.max(2, Math.ceil(Math.max(0, height - 180) / (cardWidth * 4 / 3 + 230 + 16)));
  return columns * Math.max(1, Math.min(rows, Math.floor(max / columns)));
}
