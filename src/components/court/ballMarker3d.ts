import { BALL_MARKER } from '@/components/court/courtGeometry'
import type { Camera3D, ProjectionCanvas, ProjectViewport } from '@/components/court/courtProjection'
import { project } from '@/components/court/courtProjection'

const ORIGIN = { x: 0, y: 0 }

/** Screen radius of the ball in 3D; scales with camera zoom and perspective. */
export function ballMarkerScreenRadius3d(
  xM: number,
  zM: number,
  yM: number,
  meter: number,
  camera: Camera3D,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
): number {
  const center = project(xM, zM, yM, '3d', meter, ORIGIN, camera, viewport, canvas)
  const rim = project(
    xM + BALL_MARKER.radiusM,
    zM,
    yM,
    '3d',
    meter,
    ORIGIN,
    camera,
    viewport,
    canvas,
  )
  return Math.max(BALL_MARKER.minRadiusPx, Math.hypot(rim.x - center.x, rim.y - center.y))
}
