import { ballMarkerScreenRadius3d } from '@/components/court/ballMarker3d'
import {
  BALL_SEAM_PATHS,
  BALL_SEAM_STROKE,
  BALL_SEAM_WIDTH,
  BALL_VIEW_CENTER,
} from '@/components/court/ballSeamPaths'
import { ballMarkerRadiusPx, COURT, type CourtDimensions, type ViewMode } from '@/components/court/courtGeometry'
import type {
  Camera3D,
  ProjectionCanvas,
  ProjectViewport,
} from '@/components/court/courtProjection'
import { project } from '@/components/court/courtProjection'
import type { BallPlacement } from '@/lib/ballPlacement'

const ORIGIN = { x: 0, y: 0 }
const BALL_OUTER_STROKE = '#c62828'

function ballMetersFromPlacement(placement: BallPlacement): { xM: number; zM: number; yM: number } {
  const pad = COURT.extraSpaceM / 2
  const x = Math.min(Math.max(placement.normalized.x, 0), 1)
  const y = Math.min(Math.max(placement.normalized.y, 0), 1)

  return {
    xM: pad + x * COURT.widthM,
    zM: pad + y * COURT.lengthM,
    yM: placement.heightM,
  }
}

function drawIconStyleBall(
  ctx: CanvasRenderingContext2D,
  screen: { x: number; y: number },
  outerRadius: number,
): void {
  const innerRadius = outerRadius * (26 / 29)
  const scale = innerRadius / BALL_VIEW_CENTER

  ctx.beginPath()
  ctx.arc(screen.x, screen.y, innerRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(screen.x, screen.y, innerRadius, 0, Math.PI * 2)
  ctx.clip()

  ctx.translate(screen.x, screen.y)
  ctx.scale(scale, scale)
  ctx.translate(-BALL_VIEW_CENTER, -BALL_VIEW_CENTER)
  ctx.strokeStyle = BALL_SEAM_STROKE
  ctx.lineWidth = BALL_SEAM_WIDTH
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const pathData of BALL_SEAM_PATHS) {
    ctx.stroke(new Path2D(pathData))
  }

  ctx.restore()

  ctx.beginPath()
  ctx.arc(screen.x, screen.y, outerRadius, 0, Math.PI * 2)
  ctx.lineWidth = Math.max(2, outerRadius * 0.12)
  ctx.strokeStyle = BALL_OUTER_STROKE
  ctx.stroke()
}

export function drawBallMarker(
  ctx: CanvasRenderingContext2D,
  placement: BallPlacement,
  mode: ViewMode,
  dims: CourtDimensions,
  camera: Camera3D,
  image: HTMLImageElement | null,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
): void {
  const { xM, zM, yM } = ballMetersFromPlacement(placement)
  const { meter } = dims
  const screen = project(xM, zM, yM, mode, meter, ORIGIN, camera, viewport, canvas)
  const radius =
    mode === '3d'
      ? ballMarkerScreenRadius3d(xM, zM, yM, meter, camera, viewport, canvas)
      : ballMarkerRadiusPx(meter)
  const size = radius * 2

  if (image) {
    ctx.drawImage(image, screen.x - radius, screen.y - radius, size, size)
    return
  }

  drawIconStyleBall(ctx, screen, radius)
}
