import type { PlayerCoordinates } from '@/models/rotation'
import type { RotationNumber, TeamSide } from '@/models/match'
import bundledFormationsJson from '../../public/volleyball-formations.json'

/** Maps rotation number + serve/receive → bundled formation id */
export function rotationVariantId(rotation: RotationNumber, role: 'serve' | 'receive'): string {
  return `p${rotation}-${role}`
}

/** Get formation id for a team given their rotation and whether they are serving */
export function formationIdForTeam(
  rotation: RotationNumber,
  servingTeam: TeamSide,
  team: TeamSide,
): string {
  const role = team === servingTeam ? 'serve' : 'receive'
  return rotationVariantId(rotation, role)
}

const formations = bundledFormationsJson as Record<string, Record<string, { x: number; y: number }>>

/** Get raw coordinates from bundled JSON for a given formation id */
export function getFormationCoordinates(formationId: string): PlayerCoordinates {
  return (formations[formationId] as PlayerCoordinates | undefined) ?? {}
}

type Lineup = string[]

const M1_LINEUP: Lineup = ['setter-1', 'opposite-1', 'middle-1', 'left-1', 'libero', 'left-2']
const M2_LINEUP: Lineup = ['setter-1', 'opposite-1', 'middle-2', 'left-1', 'libero', 'left-2']
const DOUBLE_MIDDLE_LINEUP: Lineup = [
  'setter-1',
  'opposite-1',
  'middle-1',
  'left-1',
  'middle-2',
  'left-2',
]

const ROTATION_LINEUPS: Partial<Record<string, Lineup>> = {
  'p1-serve': M2_LINEUP,
  'p1-receive': M2_LINEUP,
  'p6-receive': M2_LINEUP,
  'p6-serve': M2_LINEUP,
  'p5-serve': DOUBLE_MIDDLE_LINEUP,
  'p5-receive': M1_LINEUP,
  'p4-serve': M1_LINEUP,
  'p4-receive': M1_LINEUP,
  'p3-serve': M1_LINEUP,
  'p3-receive': M1_LINEUP,
  'p2-serve': DOUBLE_MIDDLE_LINEUP,
  'p2-receive': M2_LINEUP,
}

export function lineupForRotation(rotationId: string): Lineup {
  return ROTATION_LINEUPS[rotationId] ?? M1_LINEUP
}

export const ROLE_DISPLAY: Record<string, { name: string; abbr: string }> = {
  'setter-1': { name: 'Setter', abbr: 'S' },
  'opposite-1': { name: 'Opposite', abbr: 'O' },
  'middle-1': { name: 'Middle 1', abbr: 'MB' },
  'middle-2': { name: 'Middle 2', abbr: 'MB' },
  'left-1': { name: 'Left', abbr: 'LE' },
  libero: { name: 'Libero', abbr: 'L' },
  'left-2': { name: 'Left 2', abbr: 'LE' },
}
