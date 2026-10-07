<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue'

import { COURT } from '@/components/court/courtGeometry'
import { getRotationSlots, type RotationZone } from '@/lib/rotationSlots'

const props = defineProps<{
  rotationId: string
}>()

const slots = computed(() => getRotationSlots(props.rotationId))

const PAD = 10
const COURT_W = 80
const COURT_H = 80
const VIEW_W = PAD * 2 + COURT_W
const VIEW_H = PAD + COURT_H + 6
const ATTACK_Y = PAD + COURT_H * (COURT.threeMeterM / (COURT.lengthM / 2))
const LINE = 1.6
const NET_OVERHANG = COURT_W * 0.05
const POLE_OFFSET = COURT_W * (0.6 / COURT.widthM)
const POLE_R = 2.4
const MARKER_R = 7.4
const MARKER_FONT = 5.6
const NET_Y = PAD
const BASE_Y = PAD + COURT_H
const NET_X1 = PAD - NET_OVERHANG
const NET_X2 = PAD + COURT_W + NET_OVERHANG
const POLE_LEFT_X = PAD - POLE_OFFSET
const POLE_RIGHT_X = PAD + COURT_W + POLE_OFFSET
const FRONT_Y = (NET_Y + ATTACK_Y) / 2
const BACK_Y = (ATTACK_Y + BASE_Y) / 2
const LEFT_X = PAD + COURT_W * 0.18
const MID_X = PAD + COURT_W * 0.5
const RIGHT_X = PAD + COURT_W * 0.82

const ZONE_CELLS: Record<RotationZone, { x: number; y: number }> = {
  4: { x: LEFT_X, y: FRONT_Y },
  3: { x: MID_X, y: FRONT_Y },
  2: { x: RIGHT_X, y: FRONT_Y },
  5: { x: LEFT_X, y: BACK_Y },
  6: { x: MID_X, y: BACK_Y },
  1: { x: RIGHT_X, y: BACK_Y },
}

const INSET_PX = 14
const SCALE_MIN = 0.45
const SCALE_MAX = 2.4

const rootRef = ref<HTMLElement | null>(null)
const offset = ref({ x: INSET_PX, y: INSET_PX })
const scale = ref(1)
const minimized = ref(false)
const dragging = ref(false)
const scaling = ref(false)

let dragStart = { pointerX: 0, pointerY: 0, x: 0, y: 0 }
let scaleStart = { pointerX: 0, pointerY: 0, scale: 1, originX: 0, originY: 0, distance: 1 }
let activePointerId: number | null = null

function clampOffset(x: number, y: number): { x: number; y: number } {
  const el = rootRef.value
  const bounds = el?.offsetParent
  if (!el || !(bounds instanceof HTMLElement)) {
    return { x, y }
  }

  const maxX = Math.max(0, bounds.clientWidth - el.offsetWidth)
  const maxY = Math.max(0, bounds.clientHeight - el.offsetHeight)
  return {
    x: Math.min(Math.max(x, 0), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  }
}

function onGripPointerDown(event: PointerEvent) {
  if (event.button !== 0 || scaling.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  dragging.value = true
  activePointerId = event.pointerId
  dragStart = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    x: offset.value.x,
    y: offset.value.y,
  }

  const grip = event.currentTarget as HTMLElement
  grip.setPointerCapture(event.pointerId)
}

function onGripPointerMove(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== activePointerId) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  offset.value = clampOffset(
    dragStart.x + event.clientX - dragStart.pointerX,
    dragStart.y + event.clientY - dragStart.pointerY,
  )
}

function onScalePointerDown(event: PointerEvent) {
  if (event.button !== 0 || dragging.value || minimized.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  const el = rootRef.value
  if (!el) {
    return
  }

  const box = el.getBoundingClientRect()
  const distance = Math.hypot(event.clientX - box.left, event.clientY - box.top)
  scaling.value = true
  activePointerId = event.pointerId
  scaleStart = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    scale: scale.value,
    originX: box.left,
    originY: box.top,
    distance: Math.max(distance, 8),
  }

  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture(event.pointerId)
}

function onScalePointerMove(event: PointerEvent) {
  if (!scaling.value || event.pointerId !== activePointerId) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  const distance = Math.hypot(event.clientX - scaleStart.originX, event.clientY - scaleStart.originY)
  const next = scaleStart.scale * (distance / scaleStart.distance)
  scale.value = Math.min(SCALE_MAX, Math.max(SCALE_MIN, next))
}

function endPointer(event: PointerEvent) {
  if (event.pointerId !== activePointerId) {
    return
  }

  event.stopPropagation()
  dragging.value = false
  scaling.value = false
  activePointerId = null
  void nextTick(() => {
    offset.value = clampOffset(offset.value.x, offset.value.y)
  })
}

function toggleMinimized() {
  minimized.value = !minimized.value
  void nextTick(() => {
    offset.value = clampOffset(offset.value.x, offset.value.y)
  })
}

onUnmounted(() => {
  dragging.value = false
  scaling.value = false
  activePointerId = null
})

const positionStyle = computed(() => ({
  left: `${offset.value.x}px`,
  top: `${offset.value.y}px`,
  '--sheet-scale': String(scale.value),
}))
</script>

<template>
  <div
    v-if="slots"
    ref="rootRef"
    class="rotation-cheat-sheet"
    :class="{
      'rotation-cheat-sheet--dragging': dragging,
      'rotation-cheat-sheet--scaling': scaling,
      'rotation-cheat-sheet--minimized': minimized,
    }"
    :style="positionStyle"
    aria-label="Original rotation"
  >
    <div class="rotation-cheat-sheet__controls">
      <button
        class="rotation-cheat-sheet__minimize-btn"
        type="button"
        :aria-label="minimized ? 'Restore cheat sheet' : 'Minimize cheat sheet'"
        @click="toggleMinimized"
        @pointerdown.stop
      >
        {{ minimized ? '+' : '−' }}
      </button>
      <button
        class="rotation-cheat-sheet__grip"
        type="button"
        aria-label="Move cheat sheet"
        @pointerdown="onGripPointerDown"
        @pointermove="onGripPointerMove"
        @pointerup="endPointer"
        @pointercancel="endPointer"
      >
        <span v-for="dot in 6" :key="dot" class="rotation-cheat-sheet__grip-dot" />
      </button>
      <button
        v-if="!minimized"
        class="rotation-cheat-sheet__resize"
        type="button"
        aria-label="Resize cheat sheet"
        @pointerdown="onScalePointerDown"
        @pointermove="onScalePointerMove"
        @pointerup="endPointer"
        @pointercancel="endPointer"
      >
        <svg
          class="rotation-cheat-sheet__resize-icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M14.2 9.3v4.9H9.3M1.8 6.7V1.8H6.7M14.2 14.2 9.6 9.6M1.8 1.8 6.4 6.4"
            fill="none"
            stroke="#000000"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div v-if="!minimized" class="rotation-cheat-sheet__court">
    <span class="rotation-cheat-sheet__label">original rotation</span>
    <svg
      class="rotation-cheat-sheet__svg"
      :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
      role="img"
      :aria-label="`Zones for ${rotationId}`"
    >
      <rect
        :x="PAD"
        :y="PAD"
        :width="COURT_W"
        :height="COURT_H"
        fill="#ffffff"
        stroke="#000000"
        :stroke-width="LINE"
      />
      <line
        :x1="PAD"
        :y1="ATTACK_Y"
        :x2="PAD + COURT_W"
        :y2="ATTACK_Y"
        stroke="#000000"
        :stroke-width="LINE"
      />
      <line
        :x1="NET_X1"
        :y1="NET_Y"
        :x2="NET_X2"
        :y2="NET_Y"
        stroke="#000000"
        :stroke-width="LINE * 1.2"
      />
      <line
        :x1="NET_X1"
        :y1="NET_Y"
        :x2="NET_X2"
        :y2="NET_Y"
        stroke="#000000"
        :stroke-width="LINE * 0.8"
      />
      <circle :cx="POLE_LEFT_X" :cy="NET_Y" :r="POLE_R" fill="#000000" />
      <circle :cx="POLE_RIGHT_X" :cy="NET_Y" :r="POLE_R" fill="#000000" />

      <g v-for="slot in slots" :key="slot.playerId">
        <circle
          :cx="ZONE_CELLS[slot.zone].x"
          :cy="ZONE_CELLS[slot.zone].y"
          :r="MARKER_R"
          fill="#ffffff"
          stroke="#000000"
          :stroke-width="1.4"
        />
        <text
          :x="ZONE_CELLS[slot.zone].x"
          :y="ZONE_CELLS[slot.zone].y"
          :font-size="MARKER_FONT"
          fill="#000000"
          font-weight="700"
          text-anchor="middle"
          dominant-baseline="central"
        >
          {{ slot.abbreviation }}
        </text>
      </g>
    </svg>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rotation-cheat-sheet {
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.3rem;
  width: auto;
  opacity: 0.8;
  pointer-events: auto;
  user-select: none;
}

.rotation-cheat-sheet__label {
  position: absolute;
  left: 50%;
  top: calc(100% + 0.35rem);
  transform: translateX(-50%);
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
  opacity: 0;
  transition: opacity 0.12s;
}

.rotation-cheat-sheet:hover .rotation-cheat-sheet__label,
.rotation-cheat-sheet:focus-within .rotation-cheat-sheet__label {
  opacity: 1;
}

.rotation-cheat-sheet--dragging .rotation-cheat-sheet__label,
.rotation-cheat-sheet--scaling .rotation-cheat-sheet__label {
  opacity: 0;
}

.rotation-cheat-sheet__controls {
  pointer-events: auto;
  order: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.3rem 0.25rem;
  border: none;
  border-radius: 0.4rem;
  background: rgba(210, 210, 210, 0.65);
}

.rotation-cheat-sheet__minimize-btn {
  width: 1.35rem;
  height: 1.35rem;
  padding: 0;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: #000000;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.rotation-cheat-sheet__grip {
  display: grid;
  grid-template-columns: repeat(2, 0.28rem);
  grid-template-rows: repeat(3, 0.28rem);
  gap: 0.16rem;
  padding: 0.28rem;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  cursor: grab;
  touch-action: none;
}

.rotation-cheat-sheet--dragging .rotation-cheat-sheet__grip {
  cursor: grabbing;
}

.rotation-cheat-sheet__grip-dot {
  width: 0.28rem;
  height: 0.28rem;
  border-radius: 50%;
  background: #000000;
}

.rotation-cheat-sheet__court {
  position: relative;
}

.rotation-cheat-sheet__svg {
  display: block;
  width: calc(13.5rem * var(--sheet-scale, 1));
  height: auto;
}

.rotation-cheat-sheet__resize {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  padding: 0;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  cursor: nwse-resize;
  touch-action: none;
}

.rotation-cheat-sheet__resize-icon {
  display: block;
  width: 0.85rem;
  height: 0.85rem;
}
</style>
