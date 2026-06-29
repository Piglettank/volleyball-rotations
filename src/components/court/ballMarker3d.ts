import { BALL_MARKER, playerMarkerRadiusBounds3d } from '@/components/court/courtGeometry'
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
  const { min, max } = playerMarkerRadiusBounds3d(meter, canvas)
  return projectedDiscRadius3d(
    xM,
    zM,
    yM,
    BALL_MARKER.radiusM,
    meter,
    ORIGIN,
    camera,
    Math.min(min, BALL_MARKER.minRadiusPx),
    max,
    viewport,
    canvas,
  )
}
