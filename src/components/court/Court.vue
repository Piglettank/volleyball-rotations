<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import CourtCanvas from '@/components/court/CourtCanvas.vue'
import {
  COURT_TOTAL_HEIGHT_M,
  COURT_TOTAL_WIDTH_M,
  getCourtDimensions,
  type ViewMode,
} from '@/components/court/courtGeometry'
import type { BallPlacement } from '@/lib/ballPlacement'
import type { CourtCoordinate } from '@/models/player'
import type { PlayerModel } from '@/models/player'

type Props = {
  players: PlayerModel[]
  formationKey: string
  ballPlacement: BallPlacement | null
}

const props = defineProps<Props>()

const viewMode = defineModel<ViewMode>('viewMode', { default: '2d' })
const controlsPanelVisible = defineModel<boolean>('controlsPanelVisible', { default: true })

const viewModeToggleLabel = computed(() => (viewMode.value === '3d' ? '2D' : '3D'))

const viewModeToggleIcon = computed(() =>
  viewMode.value === '3d' ? 'fas fa-map' : 'fas fa-cube',
)

function toggleViewMode() {
  viewMode.value = viewMode.value === '3d' ? '2d' : '3d'
}

const controlsPanelToggleLabel = computed(() => (controlsPanelVisible.value ? 'Full' : 'Panel'))

const controlsPanelToggleIcon = computed(() =>
  controlsPanelVisible.value
    ? 'fas fa-up-right-and-down-left-from-center'
    : 'fas fa-down-left-and-up-right-to-center',
)

function toggleControlsPanel() {
  controlsPanelVisible.value = !controlsPanelVisible.value
}

const drawMode = ref(false)
const hasDrawings = ref(false)
const courtCanvasRef = ref<InstanceType<typeof CourtCanvas> | null>(null)

function toggleDrawMode() {
  drawMode.value = !drawMode.value
}

function clearDrawings() {
  courtCanvasRef.value?.clearDrawings()
}

const emit = defineEmits<{
  playerCoordinateChange: [payload: { playerId: string; coordinate: CourtCoordinate }]
}>()

const containerRef = ref<HTMLElement | null>(null)
const meter = ref(30)
const containerSize = ref({ width: 0, height: 0 })

const wrapperStyle = computed(() => {
  if (viewMode.value === '3d') {
    return {
      width: '100%',
      height: '100%',
    }
  }

  const dims = getCourtDimensions(meter.value)
  return {
    width: `${dims.totalWidthPx}px`,
    height: `${dims.totalHeightPx}px`,
  }
})

const viewportSize = computed(() => {
  if (viewMode.value !== '3d') {
    return undefined
  }

  const { width, height } = containerSize.value
  if (width <= 0 || height <= 0) {
    return undefined
  }

  return { width, height }
})

function updateLayoutFromContainer() {
  const container = containerRef.value
  if (!container) {
    return
  }

  const { width, height } = container.getBoundingClientRect()
  if (width <= 0 || height <= 0) {
    return
  }

  containerSize.value = { width, height }
  meter.value = Math.min(width / COURT_TOTAL_WIDTH_M, height / COURT_TOTAL_HEIGHT_M)
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateLayoutFromContainer()
  resizeObserver = new ResizeObserver(updateLayoutFromContainer)
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div ref="containerRef" class="court-fit" :class="{ 'court-fit--3d': viewMode === '3d' }">
    <div class="court-wrapper" :class="{ 'court-wrapper--3d': viewMode === '3d' }" :style="wrapperStyle">
      <CourtCanvas
        ref="courtCanvasRef"
        :players="props.players"
        :formation-key="props.formationKey"
        :ball-placement="props.ballPlacement"
        :view-mode="viewMode"
        :draw-mode="drawMode"
        v-model:has-drawings="hasDrawings"
        :meter="meter"
        :viewport-size="viewportSize"
        @player-coordinate-change="emit('playerCoordinateChange', $event)"
      />
    </div>

    <div class="court-actions">
      <v-btn
        v-if="hasDrawings"
        class="court-action-btn"
        variant="flat"
        size="small"
        aria-label="Clear drawings"
        @click="clearDrawings"
        @pointerdown.stop
      >
        <span class="court-action-btn__content">
          <v-icon icon="fas fa-eraser" size="small" />
          <span class="court-action-btn__label">Clear</span>
        </span>
      </v-btn>

      <v-btn
        class="court-action-btn"
        :class="{ 'court-action-btn--active': drawMode }"
        variant="flat"
        size="small"
        :aria-label="drawMode ? 'Exit draw mode' : 'Enter draw mode'"
        @click="toggleDrawMode"
        @pointerdown.stop
      >
        <span class="court-action-btn__content">
          <v-icon icon="fas fa-pencil" size="small" />
          <span class="court-action-btn__label">Draw</span>
        </span>
      </v-btn>

      <v-btn
        class="court-action-btn"
        variant="flat"
        size="small"
        :aria-label="controlsPanelVisible ? 'Hide control panel' : 'Show control panel'"
        @click="toggleControlsPanel"
        @pointerdown.stop
      >
        <span class="court-action-btn__content">
          <v-icon :icon="controlsPanelToggleIcon" size="small" />
          <span class="court-action-btn__label">{{ controlsPanelToggleLabel }}</span>
        </span>
      </v-btn>

      <v-btn
        class="court-action-btn"
        variant="flat"
        size="small"
        :aria-label="`Switch to ${viewModeToggleLabel} view`"
        @click="toggleViewMode"
        @pointerdown.stop
      >
        <span class="court-action-btn__content">
          <v-icon :icon="viewModeToggleIcon" size="small" />
          <span class="court-action-btn__label">{{ viewModeToggleLabel }}</span>
        </span>
      </v-btn>
    </div>
  </div>
</template>

<style scoped lang="scss">
.court-fit {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.court-fit--3d {
  align-items: stretch;
  justify-content: stretch;
}

.court-wrapper {
  position: relative;
  flex-shrink: 0;
}

.court-wrapper--3d {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.court-actions {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  pointer-events: none;
}

.court-action-btn {
  pointer-events: auto;
  height: auto;
  min-width: 2.75rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  border: 2px solid transparent !important;
  background-color: rgba(255, 255, 255, 0.9) !important;
  color: #000 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);

  :deep(.v-btn__content) {
    flex: none;
  }

  :deep(.v-icon) {
    color: #000 !important;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.95) !important;
  }
}

.court-action-btn--active {
  border-color: #d32f2f !important;
  background-color: rgba(255, 255, 255, 0.95) !important;
}

.court-action-btn__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  line-height: 1;
}

.court-action-btn__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #000;
}
</style>
