import { COURT, PLAYER_MARKER_3D } from '@/components/court/courtGeometry'
import { APP_THEME_COLORS } from '@/styles/theme'

const SCALE = 10
const COURT_WIDTH_UNITS = COURT.widthM * SCALE

/** Match learn 2D marker size relative to court width (9 m). */
export const PLAY_MARKER_RADIUS = COURT_WIDTH_UNITS * PLAYER_MARKER_3D.minRadiusCourtWidthRatio
export const PLAY_MARKER_FONT = Math.max(2.6, PLAY_MARKER_RADIUS * 0.65)
export const PLAY_MARKER_STROKE_PX = 2
export const PLAY_BALL_RADIUS = COURT_WIDTH_UNITS * 0.033

export const PLAY_TEAM_COLORS = {
  home: { fill: APP_THEME_COLORS.home, stroke: '#ffffff' },
  away: { fill: APP_THEME_COLORS.away, stroke: '#ffffff' },
} as const
