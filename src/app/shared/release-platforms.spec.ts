import { supportsReleaseActions } from './release-platforms';

describe('collectible platforms', () => {
  it('allows PS1 actions and preserves existing consoles', () => {
    for (const id of [32, 7, 8, 9, 48, 167, 38]) expect(supportsReleaseActions(id)).toBe(true);
    for (const id of [6, 11, 46]) expect(supportsReleaseActions(id)).toBe(false);
  });
});
