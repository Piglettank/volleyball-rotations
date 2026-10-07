import type { RotationNumber } from '@/models/match'
import { canonicalFormationId, lineupForRotation, ROLE_DISPLAY } from '@/lib/matchRotation'

export type RotationZone = 1 | 2 | 3 | 4 | 5 | 6

export type RotationSlot = {
  zone: RotationZone
  playerId: string
  name: string
  abbreviation: string
}

/** Clockwise zone order after a side-out (1 → 6 → 5 → 4 → 3 → 2). */
const CLOCKWISE: readonly RotationZone[] = [1, 6, 5, 4, 3, 2]

/** Base S1 zones before the libero swap. */
const S1_BY_ZONE: Record<RotationZone, string> = {
  1: 'setter-1',
  2: 'left-1',
  3: 'middle-2',
  4: 'opposite-1',
  5: 'left-2',
  6: 'middle-1',
}

const ALL_ZONES = [1, 2, 3, 4, 5, 6] as const satisfies readonly RotationZone[]

function parseRotationNumber(formationId: string): RotationNumber | null {
  const match = canonicalFormationId(formationId).match(/^s([1-6])-(serve|receive)$/)
  if (!match) {
    return null
  }

  return Number(match[1]) as RotationNumber
}

function stepsFromS1(rotation: RotationNumber): number {
  return CLOCKWISE.indexOf(rotation)
}

function zoneAfterSteps(startZone: RotationZone, steps: number): RotationZone {
  const index = CLOCKWISE.indexOf(startZone)
  return CLOCKWISE[(index + steps) % CLOCKWISE.length]!
}

function isMiddle(playerId: string): boolean {
  return playerId === 'middle-1' || playerId === 'middle-2'
}

/** Base-zone occupancy for an S1–S6 serve/receive, or null for other formations. */
export function getRotationSlots(formationId: string): RotationSlot[] | null {
  const rotation = parseRotationNumber(formationId)
  if (!rotation) {
    return null
  }

  const steps = stepsFromS1(rotation)
  const lineup = new Set(lineupForRotation(formationId))
  const byZone = {} as Record<RotationZone, string>

  for (const startZone of ALL_ZONES) {
    byZone[zoneAfterSteps(startZone, steps)] = S1_BY_ZONE[startZone]
  }

  const slots: RotationSlot[] = []

  for (const zone of ALL_ZONES) {
    let playerId = byZone[zone]
    if (!lineup.has(playerId) && isMiddle(playerId) && lineup.has('libero')) {
      playerId = 'libero'
    }
    if (!lineup.has(playerId)) {
      continue
    }

    const role = ROLE_DISPLAY[playerId]
    slots.push({
      zone,
      playerId,
      name: role?.name ?? playerId,
      abbreviation: role?.abbr ?? '?',
    })
  }

  return slots
}
