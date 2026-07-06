import { COURT, PLAYER_MARKER_3D } from '@/components/court/courtGeometry'
import { PLAY_COURT_SVG } from '@/lib/courtPlayLayout'

const SCALE = 10
const COURT_WIDTH_UNITS = COURT.widthM * SCALE

/** Match learn 2D marker size relative to court width (9 m). */
export const PLAY_MARKER_RADIUS = COURT_WIDTH_UNITS * PLAYER_MARKER_3D.minRadiusCourtWidthRatio
export const PLAY_MARKER_FONT = Math.max(2.6, PLAY_MARKER_RADIUS * 0.58)
export const PLAY_MARKER_STROKE_PX = 2
export const PLAY_BALL_RADIUS = COURT_WIDTH_UNITS * 0.033

export const PLAY_TEAM_COLORS = {
  home: { fill: 'rgba(26, 42, 58, 0.92)', stroke: '#ffffff' },
  away: { fill: 'rgba(139, 26, 26, 0.92)', stroke: '#ffffff' },
} as const
