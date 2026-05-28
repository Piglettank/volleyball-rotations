import {
  COURT,
  PLAYER_MARKER_3D,
  type ViewMode,
} from '@/components/court/courtGeometry'
import type { Camera3D, ProjectionCanvas, ProjectViewport } from '@/components/court/courtProjection'
import { project } from '@/components/court/courtProjection'
import type { CourtCoordinate } from '@/models/player'
import type { PlayerModel } from '@/models/player'

export const PLAYER_MARKER_RADIUS_FACTOR = 0.38

const ORIGIN = { x: 0, y: 0 }

export function playerMetersOnCourt(player: PlayerModel): { xM: number; zM: number; yM: number } {
  const pad = COURT.extraSpaceM / 2
  const x = Math.min(Math.max(player.coordinate.x, 0), 1)
  const y = Math.min(Math.max(player.coordinate.y, 0), 1)

  return {
    xM: pad + x * COURT.widthM,
    zM: pad + y * COURT.lengthM,
    yM: 0,
  }
}

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy

  if (lengthSq < 1e-6) {
    return Math.hypot(px - ax, py - ay)
  }

  const t = Math.min(Math.max(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0), 1)
  const closestX = ax + t * dx
  const closestY = ay + t * dy

  return Math.hypot(px - closestX, py - closestY)
}

function getMarkerHeadScreen(
  xM: number,
  zM: number,
  meter: number,
  camera: Camera3D,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
): { x: number; y: number; radius: number } {
  const head = project(xM, zM, PLAYER_MARKER_3D.pinHeightM, '3d', meter, ORIGIN, camera, viewport, canvas)
  const rim = project(
    xM + PLAYER_MARKER_3D.pinRadiusM,
    zM,
    PLAYER_MARKER_3D.pinHeightM * 0.88,
    '3d',
    meter,
    ORIGIN,
    camera,
    viewport,
    canvas,
  )
  const radius = Math.max(12, Math.hypot(rim.x - head.x, rim.y - head.y)) + 5
  const cx = head.x
  const cy = head.y + radius * 0.2

  return { x: cx, y: cy - radius * 0.05, radius }
}

export function findPlayerAtPoint(
  players: PlayerModel[],
  screenX: number,
  screenY: number,
  mode: ViewMode,
  meter: number,
  camera: Camera3D,
  viewport3d?: ProjectViewport,
  canvas?: ProjectionCanvas,
): PlayerModel | null {
  let closest: { player: PlayerModel; distance: number } | null = null

  for (const player of players) {
    const { xM, zM } = playerMetersOnCourt(player)
    let distance: number

    if (mode === '3d') {
      const tip = project(xM, zM, 0, '3d', meter, ORIGIN, camera, viewport3d, canvas)
      const head = getMarkerHeadScreen(xM, zM, meter, camera, viewport3d, canvas)
      const tipDistance = Math.hypot(screenX - tip.x, screenY - tip.y) - 10
      const headDistance = Math.hypot(screenX - head.x, screenY - head.y) - head.radius
      const stemDistance =
        distanceToSegment(screenX, screenY, tip.x, tip.y, head.x, head.y + head.radius) - 6
      distance = Math.min(tipDistance, headDistance, stemDistance)
    } else {
      const screen = project(xM, zM, 0, mode, meter, ORIGIN, camera)
      const hitRadius = meter * PLAYER_MARKER_RADIUS_FACTOR + 6
      distance = Math.hypot(screenX - screen.x, screenY - screen.y) - hitRadius
    }

    if (distance <= 0 && (!closest || distance > closest.distance)) {
      closest = { player, distance }
    }
  }

  return closest?.player ?? null
}

export function applyScreenDeltaToCourtMeters(
  xM: number,
  zM: number,
  deltaSx: number,
  deltaSy: number,
  mode: ViewMode,
  meter: number,
  camera: Camera3D,
  viewport3d?: ProjectViewport,
  canvas?: ProjectionCanvas,
): { xM: number; zM: number } {
  const eps = 0.05
  const viewport = mode === '3d' ? viewport3d : undefined
  const base = project(xM, zM, 0, mode, meter, ORIGIN, camera, viewport, canvas)
  const alongX = project(xM + eps, zM, 0, mode, meter, ORIGIN, camera, viewport, canvas)
  const alongZ = project(xM, zM + eps, 0, mode, meter, ORIGIN, camera, viewport, canvas)

  const j11 = (alongX.x - base.x) / eps
  const j12 = (alongZ.x - base.x) / eps
  const j21 = (alongX.y - base.y) / eps
  const j22 = (alongZ.y - base.y) / eps

  const det = j11 * j22 - j12 * j21
  if (Math.abs(det) < 1e-6) {
    return { xM, zM }
  }

  const invDet = 1 / det
  const dXM = invDet * (j22 * deltaSx - j12 * deltaSy)
  const dZM = invDet * (-j21 * deltaSx + j11 * deltaSy)

  return { xM: xM + dXM, zM: zM + dZM }
}

export function metersToNormalized(xM: number, zM: number): CourtCoordinate {
  const pad = COURT.extraSpaceM / 2

  return {
    x: Math.min(Math.max((xM - pad) / COURT.widthM, 0), 1),
    y: Math.min(Math.max((zM - pad) / COURT.lengthM, 0), 1),
  }
}

export function clampPitch(pitch: number): number {
  return Math.min(Math.max(pitch, 0.2), 1.35)
}
