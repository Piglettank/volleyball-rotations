export type ViewMode = '2d' | '3d'

export const COURT = {
  widthM: 9,
  lengthM: 18,
  extraSpaceM: 4,
  attackLineM: 6,
  threeMeterM: 3,
  netHeightM: 2.43,
} as const

/** Full diagram size in meters (court + free zone). */
export const COURT_TOTAL_WIDTH_M = COURT.widthM + COURT.extraSpaceM
export const COURT_TOTAL_HEIGHT_M = COURT.lengthM + COURT.extraSpaceM

export const COURT_ASPECT_RATIO = COURT_TOTAL_WIDTH_M / COURT_TOTAL_HEIGHT_M

/** Literal court diagram colors — use on court canvas only, not general UI. */
export const COURT_COLORS = {
  line: '#ffffff',
  court: '#efb73e',
  outside: '#69b0bc',
  netMesh: 'rgba(255, 255, 255, 0.55)',
  netTape: 'rgba(255, 255, 255, 0.9)',
  netPost: '#f5f5f5',
  netPostStroke: '#cccccc',
  playerFill: 'rgba(26, 42, 58, 0.92)',
  playerStroke: '#ffffff',
  playerPinSelected: '#2d6a9f',
  playerPinHighlight: '#ffd166',
} as const

/**
 * UI theme tokens — orange brand derived from the court surface.
 * Teal (outside zone) stays on the court; not used for buttons or chrome.
 */
export const APP_THEME_COLORS = {
  /** Main action color — softened court orange, white text */
  primary: '#c9891f',
  onPrimary: '#ffffff',
  /** Selected toggles, light highlights */
  primaryContainer: '#f7edd8',
  onPrimaryContainer: '#6b4a10',
  /** Neutrals */
  text: '#1a2a3a',
  textMuted: '#5c6b7a',
  surface: '#ffffff',
  background: '#f7f8f9',
  surfaceVariant: '#eef0f2',
  border: '#dce1e6',
} as const

/** Flat circle markers on the 2D court (screen pixels). */
export const PLAYER_MARKER_2D = {
  radiusFactor: 0.5,
  minRadiusPx: 15,
  minFontPx: 12,
} as const

/** Volleyball ball indicator (world meters → screen pixels). */
export const BALL_MARKER = {
  radiusM: 0.3,
  minRadiusPx: 12,
} as const

export function ballMarkerRadiusPx(meter: number): number {
  return Math.max(BALL_MARKER.minRadiusPx, meter * BALL_MARKER.radiusM)
}

/** Vertical pin marker in 3D (meters, world space) + screen sizing. */
export const PLAYER_MARKER_3D = {
  /** Height of pin head above court floor (world Y). */
  pinHeightM: 1.4,
  pinRadiusM: 0.42,
  /** Hide the pin stem below this screen length (top-down / collapsed stem). */
  minStemLengthPx: 1,
  /** Min/max pin head radius as a fraction of playable court width on screen. */
  minRadiusCourtWidthRatio: 0.052,
  maxRadiusCourtWidthRatio: 0.09,
  /** Hard cap as a fraction of the shorter viewport side. */
  maxRadiusViewportRatio: 0.065,
} as const

export function playerMarkerRadius2d(meter: number): number {
  return Math.max(PLAYER_MARKER_2D.minRadiusPx, meter * PLAYER_MARKER_2D.radiusFactor)
}

export function playerMarkerFont2d(meter: number): number {
  return playerMarkerFontFromRadius(playerMarkerRadius2d(meter))
}

export function playerMarkerFontFromRadius(radius: number): number {
  return Math.max(PLAYER_MARKER_2D.minFontPx, radius * 0.58)
}

export type MarkerViewportSize = { widthPx: number; heightPx: number }

export function playerMarkerRadiusBounds3d(
  meter: number,
  viewport?: MarkerViewportSize,
): { min: number; max: number } {
  const courtWidthPx = COURT.widthM * meter
  const shortSidePx = viewport
    ? Math.min(viewport.widthPx, viewport.heightPx)
    : Math.min(COURT_TOTAL_WIDTH_M * meter, COURT_TOTAL_HEIGHT_M * meter)

  const max = Math.min(
    courtWidthPx * PLAYER_MARKER_3D.maxRadiusCourtWidthRatio,
    shortSidePx * PLAYER_MARKER_3D.maxRadiusViewportRatio,
  )
  const min = Math.min(
    max,
    Math.max(
      PLAYER_MARKER_2D.minRadiusPx,
      courtWidthPx * PLAYER_MARKER_3D.minRadiusCourtWidthRatio,
      playerMarkerRadius2d(meter) * 0.9,
    ),
  )

  return { min, max }
}

const MARKER_STROKE_WIDTH_FACTOR = 2 / 3

/** Player marker outline width; fixed screen pixels (not affected by 3D camera zoom). */
export function playerMarkerStrokeWidth(isSelected: boolean, courtLineWidth: number): number {
  const factor = isSelected ? 1 : MARKER_STROKE_WIDTH_FACTOR
  const minPx = isSelected ? 3 : 2
  return Math.max(minPx, courtLineWidth * factor)
}

export type CourtDimensions = {
  meter: number
  lineWidth: number
  courtWidthPx: number
  courtHeightPx: number
  totalWidthPx: number
  totalHeightPx: number
  paddingPx: number
}

export function getCourtDimensions(
  meter: number,
  viewportSize?: { width: number; height: number },
): CourtDimensions {
  const paddingPx = (COURT.extraSpaceM / 2) * meter
  const courtWidthPx = COURT.widthM * meter
  const courtHeightPx = COURT.lengthM * meter
  const totalWidthPx = viewportSize?.width ?? (COURT.widthM + COURT.extraSpaceM) * meter
  const totalHeightPx = viewportSize?.height ?? (COURT.lengthM + COURT.extraSpaceM) * meter

  return {
    meter,
    lineWidth: 0.1 * meter,
    courtWidthPx,
    courtHeightPx,
    totalWidthPx,
    totalHeightPx,
    paddingPx,
  }
}

/** Normalized overlay coords (0–1) → meters on court floor. */
export function normalizedToMeters(x: number, y: number): { xM: number; zM: number } {
  return {
    xM: Math.min(Math.max(x, 0), 1) * COURT.widthM,
    zM: Math.min(Math.max(y, 0), 1) * COURT.lengthM,
  }
}
