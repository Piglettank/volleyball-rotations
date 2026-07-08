/**
 * UI theme tokens — orange brand derived from the court surface color.
 * Teal (outside zone) stays on the court; not used for buttons or chrome.
 */
export const APP_THEME_COLORS = {
  /** Main action color — softened court orange, white text */
  primary: '#c9891f',
  onPrimary: '#ffffff',
  /** Selected toggles, light highlights */
  primaryContainer: '#f7edd8',
  onPrimaryContainer: '#6b4a10',
  /**
   * Team colors — colorblind-safe pair (blue / crimson).
   * Blue is unaffected by red-green colorblindness; crimson is clearly
   * distinct from blue for all common colorblindness types.
   */
  home: '#1565C0',
  onHome: '#ffffff',
  away: '#B71C1C',
  onAway: '#ffffff',
  /** Neutrals */
  text: '#1a2a3a',
  textMuted: '#5c6b7a',
  surface: '#ffffff',
  background: '#f7f8f9',
  surfaceVariant: '#eef0f2',
  border: '#dce1e6',
} as const
