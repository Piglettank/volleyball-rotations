export type ProfilePlayer = {
  id: string
  name: string
  createdAt: number
}

export type PlayerFolder = {
  id: string
  name: string
  playerIds: string[]
}

export type Profile = {
  players: ProfilePlayer[]
  folders: PlayerFolder[]
}

export const UNCATEGORIZED_FOLDER_ID = 'uncategorized'

export function abbreviationFromName(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || '?'
}
