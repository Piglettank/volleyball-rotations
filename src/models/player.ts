export type CourtCoordinate = {
  x: number
  y: number
}

export type RosterPlayer = {
  id: string
  name: string
  abbreviation: string
}

/** Player placed on court for the active formation. */
export type PlayerModel = RosterPlayer & {
  coordinate: CourtCoordinate
}
