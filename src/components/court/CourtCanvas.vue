<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

import {
  normalizeDrawPoint,
  paintStrokes,
  type DrawStroke,
} from '@/components/court/courtDrawing'
import {
  applyScreenDeltaToCourtMeters,
  clampPitch,
  findPlayerAtPoint,
  getPlayerMarkerScreenCenter,
  metersToNormalized,
  playerMetersOnCourt,
} from '@/components/court/courtInteraction'
import { getCourtDimensions, type ViewMode } from '@/components/court/courtGeometry'
import { createPlayerPositionAnimator } from '@/components/court/courtPlayerAnimation'
import { getBallImage, loadBallImage } from '@/components/court/ballImage'
import { drawBallMarker } from '@/components/court/drawBall'
import {
  drawCourtGeometry,
  drawPlayerMarkers,
  prepareCanvasDraw,
} from '@/components/court/drawCourt'
import type { BallPlacement } from '@/lib/ballPlacement'
import type { Camera3D, ProjectionCanvas, ProjectViewport } from '@/components/court/courtProjection'
import { clampZoom, compute3dViewport, DEFAULT_CAMERA_3D } from '@/components/court/courtProjection'
import type { CourtCoordinate } from '@/models/player'
import type { PlayerModel } from '@/models/player'

type Props = {
  players: PlayerModel[]
  /** Changes when group/variant changes — triggers position animation. */
  formationKey: string
  /** Derived from rotation id; not persisted. */
  ballPlacement: BallPlacement | null
  viewMode: ViewMode
  drawMode?: boolean
  meter?: number
  /** When set (3D), canvas fills this pixel area instead of the fixed court aspect box. */
  viewportSize?: { width: number; height: number }
}

const props = withDefaults(defineProps<Props>(), {
  meter: 30,
  drawMode: false,
})

const hasDrawings = defineModel<boolean>('hasDrawings', { default: false })

const emit = defineEmits<{
  playerCoordinateChange: [payload: { playerId: string; coordinate: CourtCoordinate }]
}>()

const stackRef = ref<HTMLDivElement | null>(null)
const courtCanvasRef = ref<HTMLCanvasElement | null>(null)
const playersCanvasRef = ref<HTMLCanvasElement | null>(null)
const drawCanvasRef = ref<HTMLCanvasElement | null>(null)
const camera = reactive<Camera3D>({ ...DEFAULT_CAMERA_3D })

type DragState =
  | { type: 'orbit'; lastX: number; lastY: number }
  | { type: 'pan'; lastX: number; lastY: number }
  | { type: 'player'; playerId: string; lastX: number; lastY: number }

type PinchState = {
  lastDistance: number
}

const drag = ref<DragState | null>(null)
const pinch = ref<PinchState | null>(null)
const activePointers = new Map<number, { x: number; y: number }>()
const selectedPlayerId = ref<string | null>(null)
const hoveredPlayerId = ref<string | null>(null)
const tooltipFrame = ref(0)
const viewport3d = ref<ProjectViewport | null>(null)
const userViewportPan = ref({ x: 0, y: 0 })
const playerAnimator = createPlayerPositionAnimator()
const strokes = ref<DrawStroke[]>([])
const currentStroke = ref<DrawStroke | null>(null)
const drawingPointerId = ref<number | null>(null)

const hasVisibleDrawings = computed(
  () =>
    strokes.value.some((stroke) => stroke.length >= 2) ||
    (currentStroke.value?.length ?? 0) >= 2,
)

watch(
  hasVisibleDrawings,
  (value) => {
    hasDrawings.value = value
  },
  { immediate: true },
)

function getViewport3d(): ProjectViewport | undefined {
  const base = viewport3d.value
  if (!base) {
    return undefined
  }

  const { x, y } = userViewportPan.value
  if (x === 0 && y === 0) {
    return base
  }

  return {
    scale: base.scale,
    offsetX: base.offsetX + x,
    offsetY: base.offsetY + y,
  }
}

function displayPlayers(): PlayerModel[] {
  return playerAnimator.getDisplayPlayers(props.players)
}

const ORBIT_YAW_SENSITIVITY = 0.008
const ORBIT_PITCH_SENSITIVITY = 0.008
const WHEEL_ZOOM_SENSITIVITY = 0.0012

function getDims() {
  const size = props.viewportSize
  if (props.viewMode === '3d' && size && size.width > 0 && size.height > 0) {
    return getCourtDimensions(props.meter, size)
  }

  return getCourtDimensions(props.meter)
}

function getCanvasPx(dims: ReturnType<typeof getCourtDimensions>): ProjectionCanvas {
  return { widthPx: dims.totalWidthPx, heightPx: dims.totalHeightPx }
}

function updateViewport3d() {
  if (props.viewMode !== '3d') {
    viewport3d.value = null
    return
  }

  const dims = getDims()
  viewport3d.value = compute3dViewport(
    props.meter,
    dims.totalWidthPx,
    dims.totalHeightPx,
    displayPlayers(),
  )
}

function sizeCanvasElement(canvas: HTMLCanvasElement, dims: ReturnType<typeof getDims>) {
  const dpr = window.devicePixelRatio || 1

  canvas.width = dims.totalWidthPx * dpr
  canvas.height = dims.totalHeightPx * dpr
  canvas.style.width = `${dims.totalWidthPx}px`
  canvas.style.height = `${dims.totalHeightPx}px`
}

function paint() {
  const courtCanvas = courtCanvasRef.value
  const playersCanvas = playersCanvasRef.value
  if (!courtCanvas || !playersCanvas) {
    return
  }

  const dims = getDims()
  sizeCanvasElement(courtCanvas, dims)
  sizeCanvasElement(playersCanvas, dims)

  const courtCtx = courtCanvas.getContext('2d')
  const playersCtx = playersCanvas.getContext('2d')
  if (!courtCtx || !playersCtx) {
    return
  }

  if (props.viewMode === '3d' && !viewport3d.value) {
    updateViewport3d()
  }

  const viewport = props.viewMode === '3d' ? getViewport3d() : undefined

  prepareCanvasDraw(courtCtx, dims)
  drawCourtGeometry(courtCtx, props.viewMode, dims, camera, viewport)

  prepareCanvasDraw(playersCtx, dims)
  const ballImage = getBallImage()
  if (props.ballPlacement) {
    drawBallMarker(
      playersCtx,
      props.ballPlacement,
      props.viewMode,
      dims,
      camera,
      ballImage,
      viewport,
      getCanvasPx(dims),
    )
  }
  drawPlayerMarkers(
    playersCtx,
    displayPlayers(),
    props.viewMode,
    dims,
    camera,
    selectedPlayerId.value,
    viewport,
  )

  if (hoveredPlayerId.value) {
    tooltipFrame.value += 1
  }

  paintDrawings()
}

function stackSize() {
  const rect = stackRef.value?.getBoundingClientRect()
  return {
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
  }
}

function paintDrawings() {
  const canvas = drawCanvasRef.value
  const stack = stackRef.value
  if (!canvas || !stack) {
    return
  }

  const { width, height } = stack.getBoundingClientRect()
  if (width <= 0 || height <= 0) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const allStrokes = currentStroke.value
    ? [...strokes.value, currentStroke.value]
    : strokes.value
  paintStrokes(ctx, allStrokes, width, height)
}

function clearDrawings() {
  strokes.value = []
  currentStroke.value = null
  drawingPointerId.value = null
  paintDrawings()
}

function appendDrawPoint(x: number, y: number) {
  const { width, height } = stackSize()
  const point = normalizeDrawPoint(x, y, width, height)

  if (!currentStroke.value) {
    currentStroke.value = [point]
  } else {
    currentStroke.value.push(point)
  }

  paintDrawings()
}

function finalizeCurrentStroke() {
  if (!currentStroke.value?.length) {
    currentStroke.value = null
    return
  }

  strokes.value.push([...currentStroke.value])
  currentStroke.value = null
  paintDrawings()
}

function canvasToStackPoint(canvasX: number, canvasY: number): { x: number; y: number } | null {
  const canvas = courtCanvasRef.value
  const stack = stackRef.value
  if (!canvas || !stack) return null

  const canvasRect = canvas.getBoundingClientRect()
  const stackRect = stack.getBoundingClientRect()

  return {
    x: canvasX + canvasRect.left - stackRect.left,
    y: canvasY + canvasRect.top - stackRect.top,
  }
}

function hitTestPlayers(screenX: number, screenY: number): PlayerModel | null {
  return findPlayerAtPoint(
    displayPlayers(),
    screenX,
    screenY,
    props.viewMode,
    props.meter,
    camera,
    getViewport3d(),
    getCanvasPx(getDims()),
  )
}

const hoveredPlayer = computed(() => {
  if (!hoveredPlayerId.value) return null
  return displayPlayers().find((player) => player.id === hoveredPlayerId.value) ?? null
})

const tooltipStyle = computed(() => {
  tooltipFrame.value
  const player = hoveredPlayer.value
  if (!player) return undefined

  const center = getPlayerMarkerScreenCenter(
    player,
    props.viewMode,
    props.meter,
    camera,
    getViewport3d(),
    getCanvasPx(getDims()),
  )
  const stackCenter = canvasToStackPoint(center.x, center.y)
  const stackAbove = canvasToStackPoint(center.x, center.y - center.radius)
  if (!stackCenter || !stackAbove) return undefined

  const markerRadiusPx = stackCenter.y - stackAbove.y

  return {
    left: `${stackCenter.x}px`,
    top: `${stackCenter.y}px`,
    transform: `translate(-50%, calc(-100% - ${markerRadiusPx}px - 0.35rem))`,
  }
})

function updateHoveredPlayer(screenX: number, screenY: number) {
  if (props.drawMode || drag.value || pinch.value) {
    hoveredPlayerId.value = null
    return
  }

  const hit = hitTestPlayers(screenX, screenY)
  hoveredPlayerId.value = hit?.id ?? null
}

function canvasPoint(event: PointerEvent): { x: number; y: number } {
  const stack = stackRef.value!
  const rect = stack.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function activePointerDistance(): number {
  const points = [...activePointers.values()]
  if (points.length < 2) {
    return 0
  }

  const first = points[0]!
  const second = points[1]!
  return Math.hypot(second.x - first.x, second.y - first.y)
}

function beginPinchIfNeeded() {
  if (props.viewMode !== '3d' || activePointers.size < 2) {
    return
  }

  const distance = activePointerDistance()
  if (distance < 1) {
    return
  }

  drag.value = null
  pinch.value = { lastDistance: distance }
}

function applyPinchZoom() {
  const state = pinch.value
  if (!state) {
    return
  }

  const distance = activePointerDistance()
  if (distance < 1 || state.lastDistance < 1) {
    return
  }

  camera.zoom = clampZoom(camera.zoom * (distance / state.lastDistance))
  state.lastDistance = distance
  paint()
}

function onPointerDown(event: PointerEvent) {
  const point = canvasPoint(event)
  activePointers.set(event.pointerId, point)
  stackRef.value?.setPointerCapture(event.pointerId)

  if (props.drawMode) {
    selectedPlayerId.value = null
    hoveredPlayerId.value = null
    drag.value = null
    pinch.value = null
    if (activePointers.size === 1) {
      drawingPointerId.value = event.pointerId
      currentStroke.value = null
      appendDrawPoint(point.x, point.y)
    }
    return
  }

  if (props.viewMode === '3d' && event.button === 1) {
    event.preventDefault()
    selectedPlayerId.value = null
    hoveredPlayerId.value = null
    drag.value = { type: 'pan', lastX: point.x, lastY: point.y }
    return
  }

  if (activePointers.size >= 2) {
    hoveredPlayerId.value = null
    beginPinchIfNeeded()
    return
  }

  const { x, y } = point
  const hit = hitTestPlayers(x, y)

  if (hit) {
    selectedPlayerId.value = hit.id
    hoveredPlayerId.value = null
    drag.value = { type: 'player', playerId: hit.id, lastX: x, lastY: y }
    return
  }

  if (props.viewMode !== '3d') return

  selectedPlayerId.value = null
  hoveredPlayerId.value = null
  drag.value = { type: 'orbit', lastX: x, lastY: y }
}

function onPointerMove(event: PointerEvent) {
  const point = canvasPoint(event)

  if (!activePointers.has(event.pointerId)) {
    updateHoveredPlayer(point.x, point.y)
    return
  }

  activePointers.set(event.pointerId, point)

  if (props.drawMode && currentStroke.value && event.pointerId === drawingPointerId.value) {
    appendDrawPoint(point.x, point.y)
    return
  }

  if (pinch.value && activePointers.size >= 2) {
    applyPinchZoom()
    return
  }

  const state = drag.value
  if (!state) return

  const { x, y } = point
  const deltaX = x - state.lastX
  const deltaY = y - state.lastY
  state.lastX = x
  state.lastY = y

  if (state.type === 'orbit') {
    camera.yaw -= deltaX * ORBIT_YAW_SENSITIVITY
    camera.pitch = clampPitch(camera.pitch + deltaY * ORBIT_PITCH_SENSITIVITY)
    paint()
    return
  }

  if (state.type === 'pan') {
    userViewportPan.value = {
      x: userViewportPan.value.x + deltaX,
      y: userViewportPan.value.y + deltaY,
    }
    paint()
    return
  }

  const player = displayPlayers().find((entry) => entry.id === state.playerId)
  if (!player) return

  const { xM, zM } = playerMetersOnCourt(player)
  const moved = applyScreenDeltaToCourtMeters(
    xM,
    zM,
    deltaX,
    deltaY,
    props.viewMode,
    props.meter,
    camera,
    getViewport3d(),
    getCanvasPx(getDims()),
  )

  const coordinate = metersToNormalized(moved.xM, moved.zM)
  playerAnimator.setPlayerCoordinate(state.playerId, coordinate)
  emit('playerCoordinateChange', {
    playerId: state.playerId,
    coordinate,
  })
  paint()
}

function onPointerUp(event: PointerEvent) {
  const wasDrawing =
    props.drawMode &&
    drawingPointerId.value === event.pointerId &&
    currentStroke.value !== null

  activePointers.delete(event.pointerId)
  stackRef.value?.releasePointerCapture(event.pointerId)

  if (wasDrawing) {
    finalizeCurrentStroke()
    drawingPointerId.value = null
  }

  if (activePointers.size < 2) {
    pinch.value = null
  }

  if (activePointers.size === 0) {
    drag.value = null
  }
}

function onPointerLeave(event: PointerEvent) {
  hoveredPlayerId.value = null
  if (activePointers.has(event.pointerId)) {
    onPointerUp(event)
  }
}

function onWheel(event: WheelEvent) {
  if (props.drawMode || props.viewMode !== '3d') {
    return
  }

  const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY)
  camera.zoom = clampZoom(camera.zoom * factor)
  paint()
}

onMounted(() => {
  playerAnimator.setImmediate(props.players)
  updateViewport3d()
  paint()
  window.addEventListener('resize', onResize)
  loadBallImage()
    .then(() => paint())
    .catch(() => {
      // Fallback circle is drawn when image is unavailable.
    })
})

function onResize() {
  updateViewport3d()
  paint()
}

onUnmounted(() => {
  playerAnimator.cancel()
  window.removeEventListener('resize', onResize)
})

watch(
  () => props.formationKey,
  () => {
    clearDrawings()
    playerAnimator.animate(props.players, () => {
      updateViewport3d()
      paint()
    })
  },
)

watch(
  () => props.ballPlacement,
  () => {
    paint()
  },
)

watch(
  () => [props.viewMode, props.meter, props.viewportSize] as const,
  () => {
    updateViewport3d()
    paint()
  },
)

watch(
  () => props.viewMode,
  (mode) => {
    clearDrawings()

    if (mode === '2d') {
      drag.value = null
      pinch.value = null
      activePointers.clear()
      selectedPlayerId.value = null
      hoveredPlayerId.value = null
      Object.assign(camera, DEFAULT_CAMERA_3D)
      viewport3d.value = null
      userViewportPan.value = { x: 0, y: 0 }
      return
    }

    updateViewport3d()
    paint()
  },
)

defineExpose({ clearDrawings })
</script>

<template>
  <div
    ref="stackRef"
    class="court-canvas-stack"
    :class="{
      'is-3d': viewMode === '3d',
      'is-drawing': drawMode,
      dragging: drag !== null || pinch !== null,
      'dragging-pan': drag?.type === 'pan',
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @pointerleave="onPointerLeave"
    @wheel.prevent="onWheel"
  >
    <canvas ref="courtCanvasRef" class="court-canvas court-canvas--court" />
    <canvas ref="playersCanvasRef" class="court-canvas court-canvas--players" />
    <canvas ref="drawCanvasRef" class="court-canvas court-canvas--draw" />

    <div
      v-if="hoveredPlayer"
      class="court-canvas__tooltip"
      :style="tooltipStyle"
      role="tooltip"
    >
      {{ hoveredPlayer.name }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.court-canvas-stack {
  position: relative;
  display: block;
  touch-action: none;
  user-select: none;

  &.is-3d {
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  &.is-3d.dragging:not(.dragging-pan) {
    cursor: grabbing;
  }

  &.is-3d.dragging-pan {
    cursor: move;
  }

  &.is-drawing {
    cursor: crosshair;
  }
}

.court-canvas__tooltip {
  position: absolute;
  z-index: 2;
  padding: 0.3rem 0.55rem;
  border-radius: 0.375rem;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.92);
  pointer-events: none;
}

.court-canvas {
  display: block;

  &--players,
  &--draw {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  }

  &--draw {
    width: 100%;
    height: 100%;
  }
}
</style>
