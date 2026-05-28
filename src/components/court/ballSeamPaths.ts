/** Seam paths in 64×64 viewBox space (matches public/volleyball-ball.svg). */
export const BALL_VIEW_CENTER = 32
export const BALL_INNER_RADIUS = 26
export const BALL_OUTER_RADIUS = 29

/** Junction of the three panel groups (icon-style, slightly above-left of center). */
export const BALL_SEAM_JUNCTION = { x: 30, y: 30 } as const

/** Light gray seams like volleyball-rotations-icon. */
export const BALL_SEAM_STROKE = '#cccccc'
export const BALL_SEAM_WIDTH = 1.15

/** Three groups of three parallel curved seams. */
export const BALL_SEAM_PATHS: readonly string[] = [
  // Left → bottom-left
  'M 30 30 C 22 38, 14 46, 8 38',
  'M 30 30 C 23 35, 16 40, 10 34',
  'M 30 30 C 24 32, 18 33, 12 30',
  // Bottom-right
  'M 30 30 C 38 42, 46 50, 54 42',
  'M 30 30 C 37 37, 44 43, 52 36',
  'M 30 30 C 36 34, 42 37, 50 32',
  // Top-right
  'M 30 30 C 40 20, 50 12, 56 22',
  'M 30 30 C 38 22, 46 18, 54 26',
  'M 30 30 C 36 24, 42 21, 48 24',
]
