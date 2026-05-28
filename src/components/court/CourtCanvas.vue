<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'

import {
  applyScreenDeltaToCourtMeters,
  clampPitch,
  findPlayerAtPoint,
  metersToNormalized,
  playerMetersOnCourt,
} from '@/components/court/courtInteraction'
import { getCourtDimensions, type ViewMode } from '@/components/court/courtGeometry'
import { createPlayerPositionAnimator } from '@/components/court/courtPlayerAnimation'
import { drawCourtScene } from '@/components/court/drawCourt'
import type { Camera3D, ProjectionCanvas, ProjectViewport } from '@/components/court/courtProjection'
import { clampZoom, compute3dViewport, DEFAULT_CAMERA_3D } from '@/components/court/courtProjection'
import type { CourtCoordinate } from '@/models/player'
import type { PlayerModel } from '@/models/player'

type Props = {
  players: PlayerModel[]
  /** Changes when group/variant changes — triggers position animation. */
  formationKey: string
  viewMode: ViewMode
  meter?: number
  /** When set (3D), canvas fills this pixel area instead of the fixed court aspect box. */
  viewportSize?: { width: number; height: number }
}

const props = withDefaults(defineProps<Props>(), {
  meter: 30,
})

const emit = defineEmits<{
  playerCoordinateChange: [payload: { playerId: string; coordinate: CourtCoordinate }]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const camera = reactive<Camera3D>({ ...DEFAULT_CAMERA_3D })

type DragState =
  | { type: 'orbit'; lastX: number; lastY: number }
  | { type: 'player'; playerId: string; lastX: number; lastY: number }

type PinchState = {
  lastDistance: number
}

const drag = ref<DragState | null>(null)
const pinch = ref<PinchState | null>(null)
const activePointers = new Map<number, { x: number; y: number }>()
const selectedPlayerId = ref<string | null>(null)
const viewport3d = ref<ProjectViewport | null>(null)
const playerAnimator = createPlayerPositionAnimator()

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

function paint() {
  const canvas = canvasRef.value
  if (!canvas) return

  const dims = getDims()
  const dpr = window.devicePixelRatio || 1

  canvas.width = dims.totalWidthPx * dpr
  canvas.height = dims.totalHeightPx * dpr
  canvas.style.width = `${dims.totalWidthPx}px`
  canvas.style.height = `${dims.totalHeightPx}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (props.viewMode === '3d' && !viewport3d.value) {
    updateViewport3d()
  }

  const viewport = props.viewMode === '3d' ? (viewport3d.value ?? undefined) : undefined

  drawCourtScene(
    ctx,
    props.viewMode,
    dims,
    displayPlayers(),
    camera,
    selectedPlayerId.value,
    viewport,
  )
}

function canvasPoint(event: PointerEvent): { x: number; y: number } {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
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
  canvasRef.value?.setPointerCapture(event.pointerId)

  if (activePointers.size >= 2) {
    beginPinchIfNeeded()
    return
  }

  const { x, y } = point
  const hit = findPlayerAtPoint(
    displayPlayers(),
    x,
    y,
    props.viewMode,
    props.meter,
    camera,
    viewport3d.value ?? undefined,
    getCanvasPx(getDims()),
  )

  if (hit) {
    selectedPlayerId.value = hit.id
    drag.value = { type: 'player', playerId: hit.id, lastX: x, lastY: y }
    return
  }

  if (props.viewMode !== '3d') return

  selectedPlayerId.value = null
  drag.value = { type: 'orbit', lastX: x, lastY: y }
}

function onPointerMove(event: PointerEvent) {
  if (!activePointers.has(event.pointerId)) {
    return
  }

  const point = canvasPoint(event)
  activePointers.set(event.pointerId, point)

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
    viewport3d.value ?? undefined,
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
  activePointers.delete(event.pointerId)
  canvasRef.value?.releasePointerCapture(event.pointerId)

  if (activePointers.size < 2) {
    pinch.value = null
  }

  if (activePointers.size === 0) {
    drag.value = null
  }
}

function onPointerLeave(event: PointerEvent) {
  if (activePointers.has(event.pointerId)) {
    onPointerUp(event)
  }
}

function onWheel(event: WheelEvent) {
  if (props.viewMode !== '3d') {
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
    playerAnimator.animate(props.players, () => {
      updateViewport3d()
      paint()
    })
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
    if (mode === '2d') {
      drag.value = null
      pinch.value = null
      activePointers.clear()
      selectedPlayerId.value = null
      Object.assign(camera, DEFAULT_CAMERA_3D)
      viewport3d.value = null
      return
    }

    updateViewport3d()
    paint()
  },
)
</script>

<template>
  <canvas
    ref="canvasRef"
    class="court-canvas"
    :class="{ 'is-3d': viewMode === '3d', dragging: drag !== null || pinch !== null }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @pointerleave="onPointerLeave"
    @wheel.prevent="onWheel"
  />
</template>

<style scoped lang="scss">
.court-canvas {
  display: block;
  touch-action: none;
  user-select: none;

  &.is-3d {
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  &.is-3d.dragging {
    cursor: grabbing;
  }
}
</style>
