import { COURT } from '@/components/court/courtGeometry'
import { PLAY_COURT_SVG, PLAY_COURT_SVG_VERTICAL } from '@/lib/courtPlayLayout'
import type { PlayCourtOrientation } from '@/lib/courtPlayLayout'

/** SVG user units per meter — same as courtPlayLayout SCALE. */
const SCALE = 10

/**
 * Learn 2D draws ~2.5–3.5 px lines (0.1 × meter). Use fixed screen px so SVG
 * scaling does not blow up stroke width on wide play layout.
 */
export const PLAY_COURT_LINE_PX = 4

const PAD = COURT.extraSpaceM / 2
const OUTER_INSET = 0.5
const BASE_TICK_LEN = 0.25
const POLE_OFFSET = 0.6
const POLE_R = 1.0
const NET_OVERHANG_M = COURT.widthM * 0.05

const TOTAL_W = COURT.widthM + COURT.extraSpaceM
const BASELINE_Z = PAD + COURT.lengthM

const {
  padX: PAD_X,
  padY: PAD_Y,
  courtWidth: COURT_W,
  courtHeight: COURT_H,
  viewWidth: VW,
  viewHeight: VH,
} = PLAY_COURT_SVG

type Pt = { x: number; y: number }
type Segment = { x1: number; y1: number; x2: number; y2: number }

/**
 * Rotate learn diagram coords (x = court width, z = court length) into play SVG.
 * Same fixed transform as home-side `learnToPlaySvgCoord`.
 */
function learnToPlaySvg(learnXM: number, learnZM: number): Pt {
  return {
    x: PAD_X + (BASELINE_Z - learnZM) * SCALE,
    y: PAD_Y + (learnXM - PAD) * SCALE,
  }
}

function segment(learnX1: number, learnZ1: number, learnX2: number, learnZ2: number): Segment {
  const a = learnToPlaySvg(learnX1, learnZ1)
  const b = learnToPlaySvg(learnX2, learnZ2)
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }
}

const x0 = PAD
const x1 = PAD + COURT.widthM
const z0 = PAD
const z1 = PAD + COURT.lengthM
const midZ = PAD + COURT.lengthM / 2
const attackTop = PAD + COURT.attackLineM
const attackBottom = PAD + COURT.lengthM - COURT.attackLineM

const threeLeftX0 = OUTER_INSET
const threeLeftX1 = OUTER_INSET + COURT.threeMeterM
const threeRightX0 = TOTAL_W - OUTER_INSET - COURT.threeMeterM
const threeRightX1 = TOTAL_W - OUTER_INSET

const baseZTop = z0 - OUTER_INSET
const baseZBottom = z1 + OUTER_INSET

const poleLeftX = PAD - POLE_OFFSET
const poleRightX = TOTAL_W - (PAD - POLE_OFFSET)

/** Learn: horizontal attack lines → play: vertical at 3 m from net. */
const attackLines = [
  segment(x0, attackTop, x1, attackTop),
  segment(x0, attackBottom, x1, attackBottom),
] as const

/** Learn: horizontal dashes in side margins → play: vertical dashes in top/bottom margins at attack-line x. */
const threeMeterExtensions = [
  segment(threeLeftX0, attackTop, threeLeftX1, attackTop),
  segment(threeLeftX0, attackBottom, threeLeftX1, attackBottom),
  segment(threeRightX0, attackTop, threeRightX1, attackTop),
  segment(threeRightX0, attackBottom, threeRightX1, attackBottom),
] as const

/** Learn: vertical sideline ticks in end zone → play: horizontal sideline ticks in end zone. */
const baselineTicks = [
  segment(x0, baseZTop, x0, baseZTop + BASE_TICK_LEN),
  segment(x1, baseZTop, x1, baseZTop + BASE_TICK_LEN),
  segment(x0, baseZBottom, x0, baseZBottom - BASE_TICK_LEN),
  segment(x1, baseZBottom, x1, baseZBottom - BASE_TICK_LEN),
] as const

const netLine = segment(x0 - NET_OVERHANG_M, midZ, x1 + NET_OVERHANG_M, midZ)
const netPoleTop = learnToPlaySvg(poleLeftX, midZ)
const netPoleBottom = learnToPlaySvg(poleRightX, midZ)

export const PLAY_COURT_STROKES = {
  px: PLAY_COURT_LINE_PX,
  netHeavyPx: PLAY_COURT_LINE_PX * 1.2,
  netLightPx: PLAY_COURT_LINE_PX * 0.8,
  dash: `${PLAY_COURT_LINE_PX * 2} ${PLAY_COURT_LINE_PX * 2}`,
} as const

export const PLAY_COURT_DIAGRAM = {
  vw: VW,
  vh: VH,
  padX: PAD_X,
  padY: PAD_Y,
  courtW: COURT_W,
  courtH: COURT_H,
  strokes: PLAY_COURT_STROKES,

  attackLines,
  threeMeterExtensions,
  baselineTicks,

  net: {
    line: netLine,
    poleTopX: netPoleTop.x,
    poleTopY: netPoleTop.y,
    poleBottomX: netPoleBottom.x,
    poleBottomY: netPoleBottom.y,
    poleR: POLE_R,
  },
} as const

// ── Vertical diagram (portrait — home top, away bottom) ──────────────────────

const {
  padX: V_PAD_X,
  padY: V_PAD_Y,
  courtWidth: V_COURT_W,
  courtHeight: V_COURT_H,
  viewWidth: V_VW,
  viewHeight: V_VH,
} = PLAY_COURT_SVG_VERTICAL

/**
 * Vertical: learn coords map directly to SVG axes (no rotation).
 * x = court width → SVG x; z = court length → SVG y.
 */
function vertLearnToSvg(learnXM: number, learnZM: number): Pt {
  return {
    x: V_PAD_X + (learnXM - PAD) * SCALE,
    y: V_PAD_Y + (learnZM - PAD) * SCALE,
  }
}

function vertSegment(lx1: number, lz1: number, lx2: number, lz2: number): Segment {
  const a = vertLearnToSvg(lx1, lz1)
  const b = vertLearnToSvg(lx2, lz2)
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }
}

/** Horizontal attack lines at 3 m and 15 m from top. */
const vAttackLines = [
  vertSegment(x0, attackTop, x1, attackTop),
  vertSegment(x0, attackBottom, x1, attackBottom),
] as const

/** Short dashes in left/right margins at attack-line heights. */
const vThreeMeterExtensions = [
  vertSegment(threeLeftX0, attackTop, threeLeftX1, attackTop),
  vertSegment(threeLeftX0, attackBottom, threeLeftX1, attackBottom),
  vertSegment(threeRightX0, attackTop, threeRightX1, attackTop),
  vertSegment(threeRightX0, attackBottom, threeRightX1, attackBottom),
] as const

/** Short vertical ticks just outside each corner of the court. */
const vBaselineTicks = [
  vertSegment(x0, baseZTop, x0, baseZTop + BASE_TICK_LEN),
  vertSegment(x1, baseZTop, x1, baseZTop + BASE_TICK_LEN),
  vertSegment(x0, baseZBottom, x0, baseZBottom - BASE_TICK_LEN),
  vertSegment(x1, baseZBottom, x1, baseZBottom - BASE_TICK_LEN),
] as const

const vNetLine = vertSegment(x0 - NET_OVERHANG_M, midZ, x1 + NET_OVERHANG_M, midZ)
/** Poles on left/right sidelines at net height. */
const vNetPoleLeft = vertLearnToSvg(poleLeftX, midZ)
const vNetPoleRight = vertLearnToSvg(poleRightX, midZ)

export const PLAY_COURT_DIAGRAM_VERTICAL = {
  vw: V_VW,
  vh: V_VH,
  padX: V_PAD_X,
  padY: V_PAD_Y,
  courtW: V_COURT_W,
  courtH: V_COURT_H,
  strokes: PLAY_COURT_STROKES,

  attackLines: vAttackLines,
  threeMeterExtensions: vThreeMeterExtensions,
  baselineTicks: vBaselineTicks,

  net: {
    line: vNetLine,
    poleTopX: vNetPoleLeft.x,
    poleTopY: vNetPoleLeft.y,
    poleBottomX: vNetPoleRight.x,
    poleBottomY: vNetPoleRight.y,
    poleR: POLE_R,
  },
} as const

export function getPlayCourtDiagram(orientation: PlayCourtOrientation) {
  return orientation === 'vertical' ? PLAY_COURT_DIAGRAM_VERTICAL : PLAY_COURT_DIAGRAM
}
