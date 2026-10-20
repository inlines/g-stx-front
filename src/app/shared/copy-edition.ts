/** The user's selected copy, never another serial offered by the release. */
export function copyEdition(item: {selected_serial?: string | null; selected_edition?: string | null}): string | null {
  if (item.selected_edition) return item.selected_edition;
  const serial = item.selected_serial?.trim().toUpperCase();
  if (/\/P(?:\/|$)/.test(serial ?? '')) return 'platinum';
  if (/\/E(?:\/|$)/.test(serial ?? '')) return 'essentials';
  return null;
}
