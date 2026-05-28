import { COURT } from '@/components/court/courtGeometry'
import type { CourtCoordinate } from '@/models/player'

export type BallPlacement = {
  normalized: CourtCoordinate
  /** Height above floor in meters. */
  heightM: number
}

const BALL_POSITIONS = {
  /** Opponent baseline, left back (receive). */
  opponentServer: { x: 0.15, y: 0.04 },
  /** Our baseline, right back (serve). */
  ourServer: { x: 0.85, y: 0.98 },
  /** Net corners on opponent side. */
  attackLeft: { x: 0.1, y: 0.46 },
  attackMiddle: { x: 0.5, y: 0.46 },
  attackRight: { x: 0.9, y: 0.46 },
} as const satisfies Record<string, CourtCoordinate>

/** Serve toss / contact height — above floor so the ball does not sit on the court. */
const SERVE_HEIGHT_M = 1.1

/** Slightly above net tape for attack origins. */
const ATTACK_HEIGHT_M = COURT.netHeightM + 0.2

export function getBallPlacement(rotationId: string): BallPlacement | null {
  if (rotationId.startsWith('free-ball')) {
    return null
  }

  if (rotationId.endsWith('-receive')) {
    return { normalized: { ...BALL_POSITIONS.opponentServer }, heightM: 0 }
  }

  if (rotationId.endsWith('-serve')) {
    return { normalized: { ...BALL_POSITIONS.ourServer }, heightM: SERVE_HEIGHT_M }
  }

  if (rotationId.includes('attack-left')) {
    return { normalized: { ...BALL_POSITIONS.attackLeft }, heightM: ATTACK_HEIGHT_M }
  }

  if (rotationId.includes('attack-middle')) {
    return { normalized: { ...BALL_POSITIONS.attackMiddle }, heightM: ATTACK_HEIGHT_M }
  }

  if (rotationId.includes('attack-right')) {
    return { normalized: { ...BALL_POSITIONS.attackRight }, heightM: ATTACK_HEIGHT_M }
  }

  return null
}
