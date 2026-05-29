/**
 * Toggle features here — set to `false` to hide UI without removing code.
 */
export const featureFlags = {
  /**
   * Save / export / import in the controls panel.
   * When false, layouts load from bundled `public/volleyball-formations.json` (not localStorage).
   */
  layoutPersistence: false,
  /**
   * A-defense and free-ball formation groups in the group dropdown.
   * When false, only Start position and Defense (B-defense) are shown.
   */
  advancedDefense: false,
} as const
