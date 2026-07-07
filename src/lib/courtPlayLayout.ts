import { COURT } from '@/components/court/courtGeometry'
import type { CourtCoordinate } from '@/models/player'
import type { TeamSide } from '@/models/match'

const SCALE = 10 // SVG units per meter
const PAD = COURT.extraSpaceM / 2
const HALF_LENGTH_M = COURT.lengthM / 2
const BASELINE_Z = PAD + COURT.lengthM

export type PlayCourtOrientation = 'horizontal' | 'vertical'

/**
 * Horizontal play mode SVG layout (landscape — home left, away right).
 */
export const PLAY_COURT_SVG = {
  viewWidth: (COURT.lengthM + COURT.extraSpaceM) * SCALE,
  viewHeight: (COURT.widthM + COURT.extraSpaceM) * SCALE,
  padX: PAD * SCALE,
  padY: PAD * SCALE,
  courtWidth: COURT.lengthM * SCALE,
  courtHeight: COURT.widthM * SCALE,
  netX: (PAD + COURT.lengthM / 2) * SCALE,
} as const

/**
 * Vertical play mode SVG layout (portrait — home top, away bottom).
 */
export const PLAY_COURT_SVG_VERTICAL = {
  viewWidth: (COURT.widthM + COURT.extraSpaceM) * SCALE,
  viewHeight: (COURT.lengthM + COURT.extraSpaceM) * SCALE,
  padX: PAD * SCALE,
  padY: PAD * SCALE,
  courtWidth: COURT.widthM * SCALE,
  courtHeight: COURT.lengthM * SCALE,
  netY: (PAD + COURT.lengthM / 2) * SCALE,
} as const

export function getPlayCourtSvg(orientation: PlayCourtOrientation) {
  return orientation === 'vertical' ? PLAY_COURT_SVG_VERTICAL : PLAY_COURT_SVG
}

/**
 * Learn formations use normalized x/y where y=1 is the home baseline, y=0.5 is the
 * net, and y=0.5..1 is each team's own half (both home and away use this range).
 * x=0..1 maps to court width.
 *
 * Horizontal orientation: rotates 90° CCW — home baseline left, away right.
 * Vertical orientation: portrait — home baseline top, away baseline bottom.
 * `courtSide` ('home' | 'away') selects which half; physicalCourtSide() provides this.
 */
export function learnToPlaySvgCoord(
  learnCoord: CourtCoordinate,
  courtSide: TeamSide,
  orientation: PlayCourtOrientation = 'horizontal',
): { x: number; y: number } {
  const xLearn = Math.min(Math.max(learnCoord.x, 0), 1)
  const yLearn = Math.min(Math.max(learnCoord.y, 0), 1)

  if (orientation === 'vertical') {
    const v = PLAY_COURT_SVG_VERTICAL
    // Away team is mirrored in x (they face the opposite direction)
    const svgX =
      courtSide === 'home'
        ? v.padX + xLearn * v.courtWidth
        : v.padX + (1 - xLearn) * v.courtWidth

    // Home: y=1 is home baseline (bottom), y=0.5 is net (middle). Clamp at net.
    // Away: y=1 is away baseline (top), y=0.5 is net (middle). Clamp at net.
    const svgY =
      courtSide === 'home'
        ? v.padY + Math.max(yLearn, 0.5) * v.courtHeight
        : v.padY + (1 - Math.max(yLearn, 0.5)) * v.courtHeight

    return { x: svgX, y: svgY }
  }

  // Horizontal (original implementation)
  const learnXM = PAD + xLearn * COURT.widthM
  const learnZM = PAD + yLearn * COURT.lengthM

  const widthFromLeft = learnXM - PAD
  let xM: number
  let yM: number

  if (courtSide === 'home') {
    xM = BASELINE_Z - learnZM
    xM = Math.min(xM, HALF_LENGTH_M)
    yM = widthFromLeft
  } else {
    xM = learnZM - PAD
    xM = Math.max(xM, HALF_LENGTH_M)
    yM = COURT.widthM - widthFromLeft
  }

  yM = Math.min(Math.max(yM, 0), COURT.widthM)

  return {
    x: PLAY_COURT_SVG.padX + (xM / COURT.lengthM) * PLAY_COURT_SVG.courtWidth,
    y: PLAY_COURT_SVG.padY + (yM / COURT.widthM) * PLAY_COURT_SVG.courtHeight,
  }
}
