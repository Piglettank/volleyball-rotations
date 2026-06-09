import { BALL_MARKER } from '@/components/court/courtGeometry'
import type {
  Camera3D,
  ProjectionCanvas,
  ProjectViewport,
} from '@/components/court/courtProjection'
import { projectedDiscRadius3d } from '@/components/court/courtProjection'

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
  return projectedDiscRadius3d(
    xM,
    zM,
    yM,
    BALL_MARKER.radiusM,
    meter,
    ORIGIN,
    camera,
    BALL_MARKER.minRadiusPx,
    viewport,
    canvas,
  )
}
