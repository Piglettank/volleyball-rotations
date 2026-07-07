export type TeamSide = 'home' | 'away'

export type MatchConfig = {
  homeTeamName: string
  awayTeamName: string
  rosterPlayerIds: string[]
  initialServingTeam: TeamSide
}

export type CourtSlotId = string // e.g. 'home:setter-1', 'away:setter-1'

export type PointEvent = {
  type: 'point'
  scoringTeam: TeamSide
  homeScoreBefore: number
  awayScoreBefore: number
  servingTeamBefore: TeamSide
  homeRotationBefore: RotationNumber
  awayRotationBefore: RotationNumber
  sidesSwappedBefore: boolean
}

export type SetCompleteEvent = {
  type: 'setComplete'
  winnerTeam: TeamSide
  homeScoreBefore: number
  awayScoreBefore: number
  homeSetsWonBefore: number
  awaySetsWonBefore: number
  currentSetBefore: number
  servingTeamBefore: TeamSide
  homeRotationBefore: RotationNumber
  awayRotationBefore: RotationNumber
  sidesSwappedBefore: boolean
}

export type MatchHistoryEvent = PointEvent | SetCompleteEvent

export type RotationNumber = 1 | 2 | 3 | 4 | 5 | 6

export const DEFAULT_ROTATION = 2 as RotationNumber

export function rotationLabel(rotation: RotationNumber): string {
  return `P${rotation}`
}

export type MatchState = {
  config: MatchConfig
  homeRotation: RotationNumber
  awayRotation: RotationNumber
  servingTeam: TeamSide
  homeScore: number
  awayScore: number
  homeSetsWon: number
  awaySetsWon: number
  currentSet: number
  homeAssignments: Record<string, string | null>
  awayAssignments: Record<string, string | null>
  pointHistory: MatchHistoryEvent[]
  /** When true, home renders on the right and away on the left */
  sidesSwapped: boolean
}

/** Which half of the court a logical team is drawn on */
export function physicalCourtSide(team: TeamSide, sidesSwapped: boolean): TeamSide {
  if (!sidesSwapped) return team
  return team === 'home' ? 'away' : 'home'
}

/** Team shown on the left of the scoreboard / controls */
export function teamOnLeft(sidesSwapped: boolean): TeamSide {
  return sidesSwapped ? 'away' : 'home'
}

export function teamOnRight(sidesSwapped: boolean): TeamSide {
  return sidesSwapped ? 'home' : 'away'
}

export function opponentTeam(team: TeamSide): TeamSide {
  return team === 'home' ? 'away' : 'home'
}

/** Returns the team in the lead, or null if tied */
export function leadingTeam(homeScore: number, awayScore: number): TeamSide | null {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return null
}

/** True when scores meet a standard set end condition (≥25, lead by ≥2) */
export function isSetEndEligible(homeScore: number, awayScore: number): boolean {
  const max = Math.max(homeScore, awayScore)
  const diff = Math.abs(homeScore - awayScore)
  return max >= 25 && diff >= 2
}

export function nextRotation(current: RotationNumber): RotationNumber {
  return ((current % 6) + 1) as RotationNumber
}

export function prevRotation(current: RotationNumber): RotationNumber {
  return (((current - 2 + 6) % 6) + 1) as RotationNumber
}

export function stepRotationNumber(current: RotationNumber, delta: 1 | -1): RotationNumber {
  return delta === 1 ? nextRotation(current) : prevRotation(current)
}

export const COURT_ROLE_IDS = [
  'setter-1',
  'opposite-1',
  'middle-1',
  'middle-2',
  'left-1',
  'libero',
  'left-2',
] as const

export type CourtRoleId = (typeof COURT_ROLE_IDS)[number]
