import {
  COURT,
  COURT_TOTAL_HEIGHT_M,
  COURT_TOTAL_WIDTH_M,
  PLAYER_MARKER_3D,
  type ViewMode,
} from '@/components/court/courtGeometry'
import type { PlayerModel } from '@/models/player'

export type Point2D = { x: number; y: number }

export type Camera3D = {
  yaw: number
  pitch: number
  /** Perspective zoom multiplier (1 = default framing). */
  zoom: number
}

export const DEFAULT_CAMERA_3D: Camera3D = {
  yaw: -0.55,
  pitch: 0.52,
  zoom: 1.2,
}

/** Starting 3D camera on the learn rotations page. */
export const ROTATIONS_CAMERA_3D: Camera3D = {
  yaw: 0.3,
  pitch: 0.84,
  zoom: 1.2,
}

const MIN_ZOOM = 0.55
const MAX_ZOOM = 2.75

export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM)
}

/** Uniform scale + offset applied after perspective divide (3D only). */
export type ProjectViewport = {
  scale: number
  offsetX: number
  offsetY: number
}

/** Canvas pixel size used for 3D projection centering. */
export type ProjectionCanvas = {
  widthPx: number
  heightPx: number
}

export function projectionCanvasForMeter(
  meter: number,
  canvas?: ProjectionCanvas,
): ProjectionCanvas {
  return (
    canvas ?? {
      widthPx: COURT_TOTAL_WIDTH_M * meter,
      heightPx: COURT_TOTAL_HEIGHT_M * meter,
    }
  )
}

/** Distance from court center to camera (meters). */
const CAMERA_DISTANCE_M = 26

/** Focal length scale relative to `meter` (higher = narrower FOV). */
const FOCAL_LENGTH_FACTOR = 28

/** Extra pan after auto-centering the 3D scene (fraction of canvas size). */
const VIEWPORT_PAN_X_RATIO = 0.08
const VIEWPORT_PAN_Y_RATIO = 0.12

function courtCenterMeters(): { cx: number; cz: number } {
  const pad = COURT.extraSpaceM / 2
  return {
    cx: pad + COURT.widthM / 2,
    cz: pad + COURT.lengthM / 2,
  }
}

function applyViewport(point: Point2D, viewport?: ProjectViewport): Point2D {
  if (!viewport) {
    return point
  }

  return {
    x: point.x * viewport.scale + viewport.offsetX,
    y: point.y * viewport.scale + viewport.offsetY,
  }
}

/** Court-space unit vector (width, length, height). */
export type CourtVec3 = { xM: number; yM: number; zM: number }

/**
 * Right and up in court meters; span the plane parallel to the image (perpendicular to view).
 * Used to measure on-screen disc radius without foreshortening along one world axis.
 */
export function cameraImagePlaneBasis(camera: Camera3D): { right: CourtVec3; up: CourtVec3 } {
  const { yaw, pitch } = camera
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)

  const right = { xM: cy, yM: 0, zM: sy }
  const up = { xM: -sp * sy, yM: cp, zM: sp * cy }

  return { right, up }
}

/** Screen radius of a world-space disc facing the camera, centered at (xM, zM, yM). */
export function projectedDiscRadius3d(
  xM: number,
  zM: number,
  yM: number,
  radiusM: number,
  meter: number,
  origin: Point2D,
  camera: Camera3D,
  minRadiusPx: number,
  maxRadiusPx: number,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
): number {
  const center = project(xM, zM, yM, '3d', meter, origin, camera, viewport, canvas)
  const { right, up } = cameraImagePlaneBasis(camera)

  let maxR = 0
  for (const axis of [right, up]) {
    for (const sign of [-1, 1] as const) {
      const rim = project(
        xM + sign * axis.xM * radiusM,
        zM + sign * axis.zM * radiusM,
        yM + sign * axis.yM * radiusM,
        '3d',
        meter,
        origin,
        camera,
        viewport,
        canvas,
      )
      maxR = Math.max(maxR, Math.hypot(rim.x - center.x, rim.y - center.y))
    }
  }

  return Math.min(maxRadiusPx, Math.max(minRadiusPx, maxR))
}

/**
 * Rotate world point into camera space (camera looks down +Z, up is +Y).
 */
function worldToCameraSpace(
  x: number,
  y: number,
  z: number,
  camera: Camera3D,
): { x: number; y: number; z: number } {
  const cosY = Math.cos(-camera.yaw)
  const sinY = Math.sin(-camera.yaw)
  const x1 = x * cosY - z * sinY
  const z1 = x * sinY + z * cosY

  const cosP = Math.cos(-camera.pitch)
  const sinP = Math.sin(-camera.pitch)
  const y1 = y * cosP - z1 * sinP
  const z2 = y * sinP + z1 * cosP + CAMERA_DISTANCE_M

  return { x: x1, y: y1, z: z2 }
}

/** Camera-space Z at the floor; larger = farther from the camera (draw first). */
export function floorCameraDepth(xM: number, zM: number, camera: Camera3D): number {
  const { cx, cz } = courtCenterMeters()
  return worldToCameraSpace(xM - cx, 0, cz - zM, camera).z
}

function project3dRaw(
  xM: number,
  zM: number,
  yM: number,
  meter: number,
  origin: Point2D,
  camera: Camera3D,
  canvas: ProjectionCanvas,
): Point2D {
  const { cx, cz } = courtCenterMeters()
  // Flip length axis so screen up/down matches the 2D diagram (y_norm 0 = top).
  const { x, y, z } = worldToCameraSpace(xM - cx, yM, cz - zM, camera)

  const depth = Math.max(z, 0.35)
  const focal = meter * FOCAL_LENGTH_FACTOR * clampZoom(camera.zoom)

  const canvasCenterX = origin.x + canvas.widthPx / 2
  const canvasCenterY = origin.y + canvas.heightPx / 2

  return {
    x: canvasCenterX + (x / depth) * focal,
    y: canvasCenterY - (y / depth) * focal,
  }
}

function pushRectSamples(
  samples: { xM: number; zM: number; yM: number }[],
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  yM: number,
) {
  samples.push(
    { xM: x0, zM: z0, yM },
    { xM: x1, zM: z0, yM },
    { xM: x1, zM: z1, yM },
    { xM: x0, zM: z1, yM },
  )
}

/** World-space points used only to compute the 3D fit zoom (not every draw call). */
export function get3dViewportFitPoints(
  players: PlayerModel[],
): { xM: number; zM: number; yM: number }[] {
  const pad = COURT.extraSpaceM / 2
  const totalW = COURT.widthM + COURT.extraSpaceM
  const totalH = COURT.lengthM + COURT.extraSpaceM
  const netZ = pad + COURT.lengthM / 2
  const netTop = COURT.netHeightM
  const poleTop = netTop + 0.2
  const antennaTop = netTop + 0.35
  const poleOffset = pad - 0.6
  const poleLeftX = poleOffset
  const poleRightX = totalW - poleOffset
  const netLeftX = pad
  const netRightX = pad + COURT.widthM

  const samples: { xM: number; zM: number; yM: number }[] = []

  pushRectSamples(samples, 0, 0, totalW, totalH, 0)
  pushRectSamples(samples, pad, pad, pad + COURT.widthM, pad + COURT.lengthM, 0)
  pushRectSamples(samples, netLeftX, netZ, netRightX, netZ, netTop)
  pushRectSamples(samples, netLeftX, netZ, netRightX, netZ, antennaTop)

  for (const poleX of [poleLeftX, poleRightX]) {
    samples.push({ xM: poleX, zM: netZ, yM: 0 }, { xM: poleX, zM: netZ, yM: poleTop })
  }

  const { right, up } = cameraImagePlaneBasis(DEFAULT_CAMERA_3D)
  const pinR = PLAYER_MARKER_3D.pinRadiusM
  const headY = PLAYER_MARKER_3D.pinHeightM

  for (const player of players) {
    const x = Math.min(Math.max(player.coordinate.x, 0), 1)
    const y = Math.min(Math.max(player.coordinate.y, 0), 1)
    const xM = pad + x * COURT.widthM
    const zM = pad + y * COURT.lengthM
    samples.push({ xM, zM, yM: 0 }, { xM, zM, yM: headY })

    for (const axis of [right, up]) {
      for (const sign of [-1, 1] as const) {
        samples.push({
          xM: xM + sign * axis.xM * pinR,
          zM: zM + sign * axis.zM * pinR,
          yM: headY + sign * axis.yM * pinR,
        })
      }
    }
  }

  return samples
}

/**
 * Scale and center the raw 3D projection so the scene fills the canvas.
 * Uses the default camera angle only so orbit/drag are not counteracted by re-framing.
 */
export function compute3dViewport(
  meter: number,
  widthPx: number,
  heightPx: number,
  players: PlayerModel[],
  marginRatio = 0,
): ProjectViewport {
  const origin = { x: 0, y: 0 }
  const canvas: ProjectionCanvas = { widthPx, heightPx }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const { xM, zM, yM } of get3dViewportFitPoints(players)) {
    const point = project3dRaw(xM, zM, yM, meter, origin, DEFAULT_CAMERA_3D, canvas)
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  const contentW = Math.max(maxX - minX, 1)
  const contentH = Math.max(maxY - minY, 1)
  const margin = marginRatio
  const scale = Math.min(
    (widthPx * (1 - margin * 2)) / contentW,
    (heightPx * (1 - margin * 2)) / contentH,
  )

  return {
    scale,
    offsetX: (widthPx - contentW * scale) / 2 - minX * scale + widthPx * VIEWPORT_PAN_X_RATIO,
    offsetY: (heightPx - contentH * scale) / 2 - minY * scale + heightPx * VIEWPORT_PAN_Y_RATIO,
  }
}

/**
 * World: x = width (0–13m total), z = length (0–22m total), y = height (up).
 */
export function project(
  xM: number,
  zM: number,
  yM: number,
  mode: ViewMode,
  meter: number,
  origin: Point2D,
  camera: Camera3D = DEFAULT_CAMERA_3D,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
): Point2D {
  if (mode === '2d') {
    return {
      x: origin.x + xM * meter,
      y: origin.y + zM * meter,
    }
  }

  const projectionCanvas = projectionCanvasForMeter(meter, canvas)
  return applyViewport(project3dRaw(xM, zM, yM, meter, origin, camera, projectionCanvas), viewport)
}
