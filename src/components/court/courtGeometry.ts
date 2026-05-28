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

/** Vertical map-pin marker dimensions (meters, world space). */
export const PLAYER_MARKER_3D = {
  /** Height of pin tip above court floor (world Y). */
  pinHeightM: 1.35,
  pinRadiusM: 0.34,
} as const

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
