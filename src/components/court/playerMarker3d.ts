import {
  PLAYER_MARKER_3D,
  playerMarkerScreenRadius3d,
} from '@/components/court/courtGeometry'
import type { Camera3D, ProjectionCanvas, ProjectViewport } from '@/components/court/courtProjection'
import { project } from '@/components/court/courtProjection'

export type ScreenPoint = { x: number; y: number }

export type PlayerMarker3dScreen = {
  tip: ScreenPoint
  head: ScreenPoint
  radius: number
  /** True when the camera is steep enough that a ground disc reads better than a pin. */
  topDown: boolean
}

const ORIGIN = { x: 0, y: 0 }

export function getPlayerMarker3dScreen(
  xM: number,
  zM: number,
  meter: number,
  camera: Camera3D,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
): PlayerMarker3dScreen {
  const { pinHeightM, pinRadiusM, topDownHeadTipFactor } = PLAYER_MARKER_3D
  const tip = project(xM, zM, 0, '3d', meter, ORIGIN, camera, viewport, canvas)
  const head = project(xM, zM, pinHeightM, '3d', meter, ORIGIN, camera, viewport, canvas)
  const rim = project(
    xM + pinRadiusM,
    zM,
    pinHeightM * 0.88,
    '3d',
    meter,
    ORIGIN,
    camera,
    viewport,
    canvas,
  )
  const radius = playerMarkerScreenRadius3d(Math.hypot(rim.x - head.x, rim.y - head.y))
  const headTipDist = Math.hypot(head.x - tip.x, head.y - tip.y)
  const topDown = headTipDist < radius * topDownHeadTipFactor

  return { tip, head, radius, topDown }
}
