import {
  COURT,
  COURT_COLORS,
  PLAYER_MARKER_3D,
  type CourtDimensions,
  type ViewMode,
} from '@/components/court/courtGeometry'
import type { Camera3D, ProjectionCanvas, ProjectViewport } from '@/components/court/courtProjection'
import { project } from '@/components/court/courtProjection'
import type { PlayerModel } from '@/models/player'

function drawLine(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  width: number,
  dashed = false,
) {
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.lineWidth = width
  ctx.strokeStyle = COURT_COLORS.line
  if (dashed) {
    ctx.setLineDash([width * 2, width * 2])
  } else {
    ctx.setLineDash([])
  }
  ctx.stroke()
  ctx.setLineDash([])
}

function drawQuad(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  fill: string,
  stroke?: { width: number; color: string },
) {
  if (points.length < 3) return
  ctx.beginPath()
  ctx.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i]!.x, points[i]!.y)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.lineWidth = stroke.width
    ctx.strokeStyle = stroke.color
    ctx.stroke()
  }
}

function courtRect(
  mode: ViewMode,
  meter: number,
  origin: { x: number; y: number },
  camera: Camera3D,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y = 0,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
) {
  return [
    project(x0, z0, y, mode, meter, origin, camera, viewport, canvas),
    project(x1, z0, y, mode, meter, origin, camera, viewport, canvas),
    project(x1, z1, y, mode, meter, origin, camera, viewport, canvas),
    project(x0, z1, y, mode, meter, origin, camera, viewport, canvas),
  ]
}

function drawOutsideAndCourt(
  ctx: CanvasRenderingContext2D,
  mode: ViewMode,
  dims: CourtDimensions,
  origin: { x: number; y: number },
  camera: Camera3D,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
) {
  const { meter, lineWidth } = dims
  const pad = COURT.extraSpaceM / 2
  const totalW = COURT.widthM + COURT.extraSpaceM
  const totalH = COURT.lengthM + COURT.extraSpaceM

  const outside = courtRect(mode, meter, origin, camera, 0, 0, totalW, totalH, 0, viewport, canvas)
  drawQuad(ctx, outside, COURT_COLORS.outside)

  const playable = courtRect(
    mode,
    meter,
    origin,
    camera,
    pad,
    pad,
    pad + COURT.widthM,
    pad + COURT.lengthM,
    0,
    viewport,
    canvas,
  )
  drawQuad(ctx, playable, COURT_COLORS.court, { width: lineWidth, color: COURT_COLORS.line })
}

function drawNet3d(
  ctx: CanvasRenderingContext2D,
  meter: number,
  origin: { x: number; y: number },
  lineWidth: number,
  camera: Camera3D,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
) {
  const pad = COURT.extraSpaceM / 2
  const netZ = pad + COURT.lengthM / 2
  const netTop = COURT.netHeightM
  const poleTop = netTop + 0.2
  const netBottom = poleTop * (2 / 3)
  const poleOffset = pad - 0.6
  const poleLeftX = poleOffset
  const poleRightX = COURT.widthM + COURT.extraSpaceM - poleOffset
  const netLeftX = pad
  const netRightX = pad + COURT.widthM

  const project3d = (xM: number, zM: number, yM: number) =>
    project(xM, zM, yM, '3d', meter, origin, camera, viewport, canvas)

  // Poles outside sidelines, floor to above net
  const poleWidth = Math.max(3, lineWidth * 2.2)
  for (const poleX of [poleLeftX, poleRightX]) {
    const base = project3d(poleX, netZ, 0)
    const top = project3d(poleX, netZ, poleTop)
    ctx.beginPath()
    ctx.moveTo(base.x, base.y)
    ctx.lineTo(top.x, top.y)
    ctx.lineWidth = poleWidth
    ctx.lineCap = 'round'
    ctx.strokeStyle = COURT_COLORS.netPost
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.strokeStyle = COURT_COLORS.netPostStroke
    ctx.stroke()
  }

  // Net mesh between court sidelines (no solid fill)
  const verticalStrands = 26
  const horizontalStrands = 3

  ctx.lineWidth = Math.max(0.8, lineWidth * 0.45)
  ctx.strokeStyle = COURT_COLORS.netMesh

  for (let i = 0; i <= verticalStrands; i++) {
    const t = i / verticalStrands
    const x = netLeftX + (netRightX - netLeftX) * t
    drawLine(ctx, project3d(x, netZ, netBottom), project3d(x, netZ, netTop), ctx.lineWidth)
  }

  for (let i = 1; i < horizontalStrands; i++) {
    const t = i / horizontalStrands
    const y = netBottom + (netTop - netBottom) * t
    drawLine(ctx, project3d(netLeftX, netZ, y), project3d(netRightX, netZ, y), ctx.lineWidth)
  }

  // Top tape along net width
  ctx.lineWidth = Math.max(1.5, lineWidth * 0.9)
  ctx.strokeStyle = COURT_COLORS.netTape
  drawLine(
    ctx,
    project3d(netLeftX, netZ, netTop),
    project3d(netRightX, netZ, netTop),
    ctx.lineWidth,
  )

  // Bottom tape where the mesh starts
  drawLine(
    ctx,
    project3d(netLeftX, netZ, netBottom),
    project3d(netRightX, netZ, netBottom),
    Math.max(1, lineWidth * 0.6),
  )

  // Antennas at net edges
  const antennaHeight = 0.35
  for (const x of [netLeftX, netRightX]) {
    drawLine(
      ctx,
      project3d(x, netZ, netTop),
      project3d(x, netZ, netTop + antennaHeight),
      lineWidth * 0.8,
    )
  }

  // Guy lines from pole tops to net top corners
  ctx.lineWidth = Math.max(1, lineWidth * 0.55)
  ctx.strokeStyle = COURT_COLORS.netTape
  drawLine(
    ctx,
    project3d(poleLeftX, netZ, poleTop),
    project3d(netLeftX, netZ, netTop),
    ctx.lineWidth,
  )
  drawLine(
    ctx,
    project3d(poleRightX, netZ, poleTop),
    project3d(netRightX, netZ, netTop),
    ctx.lineWidth,
  )
}

function drawCourtLines(
  ctx: CanvasRenderingContext2D,
  mode: ViewMode,
  dims: CourtDimensions,
  origin: { x: number; y: number },
  camera: Camera3D,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
) {
  const { meter, lineWidth } = dims
  const pad = COURT.extraSpaceM / 2
  const totalW = COURT.widthM + COURT.extraSpaceM
  const outerInset = 0.5

  const x0 = pad
  const x1 = pad + COURT.widthM
  const z0 = pad
  const z1 = pad + COURT.lengthM
  const midZ = pad + COURT.lengthM / 2
  const attackTop = pad + COURT.attackLineM
  const attackBottom = pad + COURT.lengthM - COURT.attackLineM
  const threeTop = midZ - COURT.threeMeterM
  const threeBottom = midZ + COURT.threeMeterM

  const threeLeftX0 = outerInset
  const threeLeftX1 = outerInset + COURT.threeMeterM
  const threeRightX0 = totalW - outerInset - COURT.threeMeterM
  const threeRightX1 = totalW - outerInset
  const baseXLeft = pad
  const baseXRight = totalW - pad
  const baseZTop = z0 - outerInset
  const baseZBottom = z1 + outerInset

  drawLine(
    ctx,
    project(x0, attackTop, 0, mode, meter, origin, camera, viewport, canvas),
    project(x1, attackTop, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
  )
  drawLine(
    ctx,
    project(x0, attackBottom, 0, mode, meter, origin, camera, viewport, canvas),
    project(x1, attackBottom, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
  )

  if (mode === '2d') {
    const netOverhang = COURT.widthM * 0.05
    drawLine(
      ctx,
      project(x0 - netOverhang, midZ, 0, mode, meter, origin, camera, viewport, canvas),
      project(x1 + netOverhang, midZ, 0, mode, meter, origin, camera, viewport, canvas),
      lineWidth * 1.2,
    )
    drawLine(
      ctx,
      project(x0 - netOverhang, midZ, 0, mode, meter, origin, camera, viewport, canvas),
      project(x1 + netOverhang, midZ, 0, mode, meter, origin, camera, viewport, canvas),
      lineWidth * 0.8,
    )
  }

  drawLine(
    ctx,
    project(threeLeftX0, threeTop, 0, mode, meter, origin, camera, viewport, canvas),
    project(threeLeftX1, threeTop, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
    true,
  )
  drawLine(
    ctx,
    project(threeRightX0, threeTop, 0, mode, meter, origin, camera, viewport, canvas),
    project(threeRightX1, threeTop, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
    true,
  )
  drawLine(
    ctx,
    project(threeLeftX0, threeBottom, 0, mode, meter, origin, camera, viewport, canvas),
    project(threeLeftX1, threeBottom, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
    true,
  )
  drawLine(
    ctx,
    project(threeRightX0, threeBottom, 0, mode, meter, origin, camera, viewport, canvas),
    project(threeRightX1, threeBottom, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
    true,
  )

  const baseLen = 0.25
  drawLine(
    ctx,
    project(baseXLeft, baseZTop, 0, mode, meter, origin, camera, viewport, canvas),
    project(baseXLeft, baseZTop + baseLen, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
  )
  drawLine(
    ctx,
    project(baseXRight, baseZTop, 0, mode, meter, origin, camera, viewport, canvas),
    project(baseXRight, baseZTop + baseLen, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
  )
  drawLine(
    ctx,
    project(baseXLeft, baseZBottom, 0, mode, meter, origin, camera, viewport, canvas),
    project(baseXLeft, baseZBottom - baseLen, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
  )
  drawLine(
    ctx,
    project(baseXRight, baseZBottom, 0, mode, meter, origin, camera, viewport, canvas),
    project(baseXRight, baseZBottom - baseLen, 0, mode, meter, origin, camera, viewport, canvas),
    lineWidth,
  )

  if (mode === '2d') {
    const poleR = 3.5
    const leftX = pad - 0.6
    const rightX = totalW - (pad - 0.6)
    for (const xM of [leftX, rightX]) {
      const p = project(xM, midZ, 0, mode, meter, origin, camera, viewport, canvas)
      ctx.beginPath()
      ctx.arc(p.x, p.y, poleR, 0, Math.PI * 2)
      ctx.fillStyle = COURT_COLORS.line
      ctx.fill()
    }
  }
}

function drawFlatPlayerMarker(
  ctx: CanvasRenderingContext2D,
  screen: { x: number; y: number },
  meter: number,
  label: string,
  isSelected: boolean,
) {
  const radius = meter * 0.38
  ctx.beginPath()
  ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = isSelected ? COURT_COLORS.playerPinSelected : COURT_COLORS.playerFill
  ctx.fill()
  ctx.lineWidth = isSelected ? 3 : 2
  ctx.strokeStyle = isSelected ? COURT_COLORS.playerPinHighlight : COURT_COLORS.playerStroke
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.max(10, meter * 0.24)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, screen.x, screen.y)
}

/** Classic map-pin teardrop in screen space (tip = ground contact). */
function drawPinSilhouette(
  ctx: CanvasRenderingContext2D,
  tip: { x: number; y: number },
  head: { x: number; y: number },
  radius: number,
  label: string,
  fill: string,
  stroke: string,
  lineWidth: number,
) {
  const cx = head.x
  const cy = head.y + radius * 0.2

  ctx.beginPath()
  ctx.moveTo(tip.x, tip.y)
  ctx.bezierCurveTo(
    tip.x - radius * 0.2,
    tip.y - radius * 1.2,
    cx - radius * 1.05,
    cy + radius * 0.4,
    cx - radius,
    cy,
  )
  ctx.arc(cx, cy, radius, Math.PI, 0, false)
  ctx.bezierCurveTo(
    cx + radius * 1.05,
    cy + radius * 0.4,
    tip.x + radius * 0.2,
    tip.y - radius * 1.2,
    tip.x,
    tip.y,
  )
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = stroke
  ctx.stroke()

  // Inner gloss on the bulb
  ctx.beginPath()
  ctx.arc(cx, cy - radius * 0.28, radius * 0.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.max(9, radius * 0.95)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, cx, cy - radius * 0.05)
}

function drawVerticalMapMarker(
  ctx: CanvasRenderingContext2D,
  xM: number,
  zM: number,
  meter: number,
  origin: { x: number; y: number },
  camera: Camera3D,
  label: string,
  isSelected: boolean,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
) {
  const { pinHeightM, pinRadiusM } = PLAYER_MARKER_3D
  const tip = project(xM, zM, 0, '3d', meter, origin, camera, viewport, canvas)
  const head = project(xM, zM, pinHeightM, '3d', meter, origin, camera, viewport, canvas)
  const rim = project(xM + pinRadiusM, zM, pinHeightM * 0.88, '3d', meter, origin, camera, viewport, canvas)
  const radius = Math.max(12, Math.hypot(rim.x - head.x, rim.y - head.y))

  const fill = isSelected ? COURT_COLORS.playerPinSelected : COURT_COLORS.playerFill
  const stroke = isSelected ? COURT_COLORS.playerPinHighlight : COURT_COLORS.playerStroke
  const lineWidth = isSelected ? 3 : 2

  drawPinSilhouette(ctx, tip, head, radius, label, fill, stroke, lineWidth)
}

function drawPlayers(
  ctx: CanvasRenderingContext2D,
  players: PlayerModel[],
  mode: ViewMode,
  dims: CourtDimensions,
  origin: { x: number; y: number },
  camera: Camera3D,
  selectedPlayerId: string | null,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
) {
  const { meter } = dims
  const pad = COURT.extraSpaceM / 2

  for (const player of players) {
    const x = Math.min(Math.max(player.coordinate.x, 0), 1)
    const y = Math.min(Math.max(player.coordinate.y, 0), 1)
    const xM = pad + x * COURT.widthM
    const zM = pad + y * COURT.lengthM
    const label = player.abbreviation
    const isSelected = selectedPlayerId === player.id

    if (mode === '3d') {
      drawVerticalMapMarker(ctx, xM, zM, meter, origin, camera, label, isSelected, viewport, canvas)
      continue
    }

    const screen = project(xM, zM, 0, mode, meter, origin, camera)
    drawFlatPlayerMarker(ctx, screen, meter, label, isSelected)
  }
}

export function drawCourtScene(
  ctx: CanvasRenderingContext2D,
  mode: ViewMode,
  dims: CourtDimensions,
  players: PlayerModel[],
  camera: Camera3D,
  selectedPlayerId: string | null = null,
  viewport3d?: ProjectViewport,
) {
  const dpr = window.devicePixelRatio || 1
  const width = dims.totalWidthPx
  const height = dims.totalHeightPx

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const origin = { x: 0, y: 0 }
  const viewport = mode === '3d' ? viewport3d : undefined
  const canvas: ProjectionCanvas = {
    widthPx: dims.totalWidthPx,
    heightPx: dims.totalHeightPx,
  }

  if (mode === '3d') {
    drawOutsideAndCourt(ctx, mode, dims, origin, camera, viewport, canvas)
    drawNet3d(ctx, dims.meter, origin, dims.lineWidth, camera, viewport, canvas)
    drawCourtLines(ctx, mode, dims, origin, camera, viewport, canvas)
  } else {
    drawOutsideAndCourt(ctx, mode, dims, origin, camera)
    drawCourtLines(ctx, mode, dims, origin, camera)
  }

  drawPlayers(ctx, players, mode, dims, origin, camera, selectedPlayerId, viewport, canvas)
}
