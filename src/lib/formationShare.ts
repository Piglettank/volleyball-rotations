import type { PlayerCoordinates } from '@/models/rotation'

export const FREE_PLAY_GROUP_ID = 'free-play'
export const FORMATION_QUERY = 'p'
export const ROTATION_QUERY = 'rotation'

const FORMAT_VERSION = 1
const PAYLOAD_BYTE_LENGTH = 13

/** On-court player order for free-play encoding (matches M1_LINEUP). */
export const FREE_PLAY_LINEUP: readonly string[] = [
  'setter-1',
  'opposite-1',
  'middle-1',
  'left-1',
  'libero',
  'left-2',
]

function quantizeCoord(value: number): number {
  return Math.min(Math.max(Math.round(value * 100), 0), 100)
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const pad = normalized.length % 4
    const base64 = pad ? normalized + '='.repeat(4 - pad) : normalized
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return bytes
  } catch {
    return null
  }
}

export function encodeFormationPayload(
  coordinates: PlayerCoordinates,
  lineupOrder: readonly string[] = FREE_PLAY_LINEUP,
): string | null {
  if (lineupOrder.length !== 6) {
    return null
  }

  const bytes = new Uint8Array(PAYLOAD_BYTE_LENGTH)
  bytes[0] = FORMAT_VERSION

  for (let index = 0; index < lineupOrder.length; index += 1) {
    const playerId = lineupOrder[index]!
    const coordinate = coordinates[playerId]
    if (!coordinate) {
      return null
    }

    const offset = 1 + index * 2
    bytes[offset] = quantizeCoord(coordinate.x)
    bytes[offset + 1] = quantizeCoord(coordinate.y)
  }

  return bytesToBase64Url(bytes)
}

export function decodeFormationPayload(payload: string): PlayerCoordinates | null {
  const trimmed = payload.trim()
  if (!trimmed) {
    return null
  }

  const bytes = base64UrlToBytes(trimmed)
  if (!bytes || bytes.length !== PAYLOAD_BYTE_LENGTH || bytes[0] !== FORMAT_VERSION) {
    return null
  }

  const coordinates: PlayerCoordinates = {}

  for (let index = 0; index < FREE_PLAY_LINEUP.length; index += 1) {
    const playerId = FREE_PLAY_LINEUP[index]!
    const offset = 1 + index * 2
    coordinates[playerId] = {
      x: bytes[offset]! / 100,
      y: bytes[offset + 1]! / 100,
    }
  }

  return coordinates
}

export function buildFreePlayShareUrl(
  coordinates: PlayerCoordinates,
  baseHref: string = window.location.href,
): string | null {
  const encoded = encodeFormationPayload(coordinates)
  if (!encoded) {
    return null
  }

  const url = new URL(baseHref)
  url.searchParams.set(ROTATION_QUERY, FREE_PLAY_GROUP_ID)
  url.searchParams.set(FORMATION_QUERY, encoded)
  return url.toString()
}

export function clearFormationFromUrl(): void {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(FORMATION_QUERY)) {
    return
  }

  url.searchParams.delete(FORMATION_QUERY)
  window.history.replaceState(window.history.state, '', url)
}

export function setFormationInUrl(encoded: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set(ROTATION_QUERY, FREE_PLAY_GROUP_ID)
  url.searchParams.set(FORMATION_QUERY, encoded)
  window.history.replaceState(window.history.state, '', url)
  return url.toString()
}

export function formationPayloadFromUrl(search: string = window.location.search): string | null {
  const payload = new URLSearchParams(search).get(FORMATION_QUERY)?.trim()
  return payload && payload.length > 0 ? payload : null
}
