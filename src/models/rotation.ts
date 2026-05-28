import type { CourtCoordinate } from '@/models/player'

/** Roster player id → normalized court position. */
export type PlayerCoordinates = Record<string, CourtCoordinate>

/** Persisted layouts: rotation id → player coordinates. */
export type SavedRotations = Record<string, PlayerCoordinates>

export type FormationVariant = {
  id: string
  name: string
  coordinates: PlayerCoordinates
}

/**
 * A group like "Start position" or "Defense (A-defense)".
 * A group can either have direct coordinates (no suboptions),
 * or a list of variants (suboptions).
 */
export type FormationGroup = {
  id: string
  name: string
  coordinates?: PlayerCoordinates
  variants?: FormationVariant[]
}

export type FormationLibrary = FormationGroup[]
