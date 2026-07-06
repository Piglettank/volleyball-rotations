import { COURT } from '@/components/court/courtGeometry'
import type { CourtCoordinate } from '@/models/player'
import type { TeamSide } from '@/models/match'

const SCALE = 10 // SVG units per meter
const PAD = COURT.extraSpaceM / 2
const HALF_LENGTH_M = COURT.lengthM / 2
const BASELINE_Z = PAD + COURT.lengthM

/**
 * Play mode SVG layout (includes free zone, same proportions as learn mode).
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
 * Learn formations use normalized x/y on the playable court (9 m × 18 m),
 * same as `playerMetersOnCourt` in learn mode.
 *
 * Play mode rotates the court 90° CCW: home baseline on the left, away on the right.
 * `courtSide` selects which half to draw on (home = left, away = right).
 */
export function learnToPlaySvgCoord(
  learnCoord: CourtCoordinate,
  courtSide: TeamSide,
): { x: number; y: number } {
  const xLearn = Math.min(Math.max(learnCoord.x, 0), 1)
  const yLearn = Math.min(Math.max(learnCoord.y, 0), 1)

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
