import {
  COURT,
  COURT_COLORS,
  playerMarkerFontFromRadius,
  playerMarkerRadius2d,
  playerMarkerStrokeWidth,
  type CourtDimensions,
  type ViewMode,
} from '@/components/court/courtGeometry'
import { getPlayerMarker3dScreen } from '@/components/court/playerMarker3d'
import { playerMetersOnCourt } from '@/components/court/courtInteraction'
import type {
  Camera3D,
  ProjectionCanvas,
  ProjectViewport,
} from '@/components/court/courtProjection'
import { floorCameraDepth, project } from '@/components/court/courtProjection'
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
  const { meter } = dims
  const { lineWidth } = dims
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
  const mode = '3d' as const
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
  const poleWidth = Math.max(3, lineWidth * 1.5)
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
  const { meter } = dims
  const { lineWidth } = dims
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

function drawDiscMarker(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  label: string,
  isSelected: boolean,
  strokeWidth: number,
) {
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = isSelected ? COURT_COLORS.playerPinSelected : COURT_COLORS.playerFill
  ctx.fill()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = isSelected ? COURT_COLORS.playerPinHighlight : COURT_COLORS.playerStroke
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${playerMarkerFontFromRadius(radius)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, center.x, center.y)
}

function drawFlatPlayerMarker(
  ctx: CanvasRenderingContext2D,
  screen: { x: number; y: number },
  meter: number,
  label: string,
  isSelected: boolean,
  strokeWidth: number,
) {
  drawDiscMarker(ctx, screen, playerMarkerRadius2d(meter), label, isSelected, strokeWidth)
}

/** Pin stem + head circle aligned to projected 3D points (oblique views). */
function drawLollipopPinMarker(
  ctx: CanvasRenderingContext2D,
  tip: { x: number; y: number },
  head: { x: number; y: number },
  radius: number,
  label: string,
  isSelected: boolean,
  strokeWidth: number,
) {
  const fill = isSelected ? COURT_COLORS.playerPinSelected : COURT_COLORS.playerFill
  const stroke = isSelected ? COURT_COLORS.playerPinHighlight : COURT_COLORS.playerStroke

  const stemEndX = head.x + (tip.x - head.x) * 0.08
  const stemEndY = head.y + (tip.y - head.y) * 0.08

  ctx.beginPath()
  ctx.moveTo(tip.x, tip.y)
  ctx.lineTo(stemEndX, stemEndY)
  ctx.strokeStyle = stroke
  ctx.lineWidth = strokeWidth
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(head.x, head.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = strokeWidth
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${playerMarkerFontFromRadius(radius)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, head.x, head.y)
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
  strokeWidth: number,
  viewport?: ProjectViewport,
  canvas?: ProjectionCanvas,
) {
  const marker = getPlayerMarker3dScreen(xM, zM, meter, camera, viewport, canvas)

  if (marker.topDown) {
    drawDiscMarker(ctx, marker.tip, marker.radius, label, isSelected, strokeWidth)
    return
  }

  drawLollipopPinMarker(ctx, marker.tip, marker.head, marker.radius, label, isSelected, strokeWidth)
}

function playersInDrawOrder(
  players: PlayerModel[],
  mode: ViewMode,
  camera: Camera3D,
  selectedPlayerId: string | null,
): PlayerModel[] {
  return [...players].sort((a, b) => {
    const aSelected = a.id === selectedPlayerId
    const bSelected = b.id === selectedPlayerId
    if (aSelected !== bSelected) {
      return aSelected ? 1 : -1
    }

    if (mode === '3d') {
      const aDepth = floorCameraDepth(
        playerMetersOnCourt(a).xM,
        playerMetersOnCourt(a).zM,
        camera,
      )
      const bDepth = floorCameraDepth(
        playerMetersOnCourt(b).xM,
        playerMetersOnCourt(b).zM,
        camera,
      )
      return bDepth - aDepth
    }

    return a.coordinate.y - b.coordinate.y
  })
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
  const { lineWidth } = dims
  const drawOrder = playersInDrawOrder(players, mode, camera, selectedPlayerId)

  for (const player of drawOrder) {
    const { xM, zM } = playerMetersOnCourt(player)
    const label = player.abbreviation
    const isSelected = selectedPlayerId === player.id
    const strokeWidth = playerMarkerStrokeWidth(isSelected, lineWidth)

    if (mode === '3d') {
      drawVerticalMapMarker(
        ctx,
        xM,
        zM,
        meter,
        origin,
        camera,
        label,
        isSelected,
        strokeWidth,
        viewport,
        canvas,
      )
      continue
    }

    const screen = project(xM, zM, 0, mode, meter, origin, camera)
    drawFlatPlayerMarker(ctx, screen, meter, label, isSelected, strokeWidth)
  }
}

export function prepareCanvasDraw(
  ctx: CanvasRenderingContext2D,
  dims: CourtDimensions,
): void {
  const dpr = window.devicePixelRatio || 1
  const width = dims.totalWidthPx
  const height = dims.totalHeightPx

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
}

/** Court surface, lines, and net — no player markers. */
export function drawCourtGeometry(
  ctx: CanvasRenderingContext2D,
  mode: ViewMode,
  dims: CourtDimensions,
  camera: Camera3D,
  viewport3d?: ProjectViewport,
): void {
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
    return
  }

  drawOutsideAndCourt(ctx, mode, dims, origin, camera)
  drawCourtLines(ctx, mode, dims, origin, camera)
}

/** Player markers only (drawn on a layer above the court). */
export function drawPlayerMarkers(
  ctx: CanvasRenderingContext2D,
  players: PlayerModel[],
  mode: ViewMode,
  dims: CourtDimensions,
  camera: Camera3D,
  selectedPlayerId: string | null = null,
  viewport3d?: ProjectViewport,
): void {
  const origin = { x: 0, y: 0 }
  const viewport = mode === '3d' ? viewport3d : undefined
  const canvas: ProjectionCanvas = {
    widthPx: dims.totalWidthPx,
    heightPx: dims.totalHeightPx,
  }

  drawPlayers(ctx, players, mode, dims, origin, camera, selectedPlayerId, viewport, canvas)
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
  prepareCanvasDraw(ctx, dims)
  drawCourtGeometry(ctx, mode, dims, camera, viewport3d)
  drawPlayerMarkers(ctx, players, mode, dims, camera, selectedPlayerId, viewport3d)
}
