/** IGDB platform IDs: PS2, PS3, PS4, PS5, PSP. */
export function supportsReleaseActions(platformId: number): boolean {
  return [8, 9, 48, 167, 38].includes(platformId);
}
