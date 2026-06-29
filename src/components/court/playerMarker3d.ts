import { PLAYER_MARKER_3D, playerMarkerRadiusBounds3d } from '@/components/court/courtGeometry'
import type {
  Camera3D,
  ProjectionCanvas,
  ProjectViewport,
} from '@/components/court/courtProjection'
import { projectedDiscRadius3d, project } from '@/components/court/courtProjection'

export type ScreenPoint = { x: number; y: number }

export type PlayerMarker3dScreen = {
  tip: ScreenPoint
  head: ScreenPoint
  radius: number
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
  const { pinHeightM, pinRadiusM } = PLAYER_MARKER_3D
  const { min, max } = playerMarkerRadiusBounds3d(meter, canvas)
  const tip = project(xM, zM, 0, '3d', meter, ORIGIN, camera, viewport, canvas)
  const head = project(xM, zM, pinHeightM, '3d', meter, ORIGIN, camera, viewport, canvas)
  const radius = projectedDiscRadius3d(
    xM,
    zM,
    pinHeightM,
    pinRadiusM,
    meter,
    ORIGIN,
    camera,
    min,
    max,
    viewport,
    canvas,
  )

  return { tip, head, radius }
}
