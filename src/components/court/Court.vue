<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import CourtCanvas from '@/components/court/CourtCanvas.vue'
import {
  COURT_TOTAL_HEIGHT_M,
  COURT_TOTAL_WIDTH_M,
  getCourtDimensions,
  type ViewMode,
} from '@/components/court/courtGeometry'
import type { Camera3D } from '@/components/court/courtProjection'
import { t } from '@/i18n'
import type { BallPlacement } from '@/lib/ballPlacement'
import type { CourtCoordinate } from '@/models/player'
import type { PlayerModel } from '@/models/player'

type Props = {
  players: PlayerModel[]
  formationKey: string
  ballPlacement: BallPlacement | null
  initialCamera3D?: Camera3D
}

const props = defineProps<Props>()

const viewMode = defineModel<ViewMode>('viewMode', { default: '2d' })
const controlsPanelVisible = defineModel<boolean>('controlsPanelVisible', { default: true })

const viewModeToggleLabel = computed(() => (viewMode.value === '3d' ? '2D' : '3D'))

const viewModeToggleIcon = computed(() => (viewMode.value === '3d' ? 'fas fa-map' : 'fas fa-cube'))

function toggleViewMode() {
  viewMode.value = viewMode.value === '3d' ? '2d' : '3d'
}

const controlsPanelToggleLabel = computed(() =>
  t(controlsPanelVisible.value ? 'court.full' : 'court.panel'),
)

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

type CourtAction = {
  id: string
  /** Single-letter keyboard shortcut (lowercase). */
  hotkey: string
  icon: string
  label: string
  description: string
  visible: boolean
  active?: boolean
  run: () => void
}

const courtActions = computed((): CourtAction[] => [
  {
    id: 'clear',
    hotkey: 'c',
    icon: 'fas fa-eraser',
    label: t('court.clear'),
    description: t('court.clearDrawings'),
    visible: hasDrawings.value,
    run: clearDrawings,
  },
  {
    id: 'draw',
    hotkey: 'p',
    icon: 'fas fa-pencil',
    label: t('court.draw'),
    description: t(drawMode.value ? 'court.exitDrawMode' : 'court.enterDrawMode'),
    visible: true,
    active: drawMode.value,
    run: toggleDrawMode,
  },
  {
    id: 'panel',
    hotkey: 'f',
    icon: controlsPanelToggleIcon.value,
    label: controlsPanelToggleLabel.value,
    description: t(controlsPanelVisible.value ? 'court.hidePanel' : 'court.showPanel'),
    visible: true,
    run: toggleControlsPanel,
  },
  {
    id: 'view',
    hotkey: 'd',
    icon: viewModeToggleIcon.value,
    label: viewModeToggleLabel.value,
    description: t('court.switchView', { mode: viewModeToggleLabel.value }),
    visible: true,
    run: toggleViewMode,
  },
])

// Hotkey tooltips only make sense with a real hover pointer (not touch).
const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function onHotkey(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    isTypingTarget(event.target)
  ) {
    return
  }

  const key = event.key.toLowerCase()
  const action = courtActions.value.find((entry) => entry.visible && entry.hotkey === key)
  if (!action) {
    return
  }

  event.preventDefault()
  action.run()
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
  window.addEventListener('keydown', onHotkey)
  updateLayoutFromContainer()
  resizeObserver = new ResizeObserver(updateLayoutFromContainer)
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onHotkey)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div ref="containerRef" class="court-fit" :class="{ 'court-fit--3d': viewMode === '3d' }">
    <div
      class="court-wrapper"
      :class="{ 'court-wrapper--3d': viewMode === '3d' }"
      :style="wrapperStyle"
    >
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
        :initial-camera3-d="props.initialCamera3D"
        @player-coordinate-change="emit('playerCoordinateChange', $event)"
      />
    </div>

    <div class="court-actions">
      <template v-for="action in courtActions" :key="action.id">
        <v-tooltip v-if="action.visible" location="left" :open-delay="700" :disabled="!canHover">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              class="court-action-btn"
              :class="{ 'court-action-btn--active': action.active }"
              variant="flat"
              size="small"
              :aria-label="action.description"
              :aria-keyshortcuts="action.hotkey.toUpperCase()"
              @click="action.run"
              @pointerdown.stop
            >
              <span class="court-action-btn__content">
                <v-icon :icon="action.icon" size="small" />
                <span class="court-action-btn__label">{{ action.label }}</span>
              </span>
            </v-btn>
          </template>
          <span class="court-action-tooltip">
            {{ action.description }}
            <kbd class="court-action-tooltip__key">{{ action.hotkey.toUpperCase() }}</kbd>
          </span>
        </v-tooltip>
      </template>
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
  padding: 0.35rem 0.4rem;
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
  gap: 0.2rem;
  line-height: 1;
}

.court-action-btn__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #000;
}

.court-action-tooltip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.court-action-tooltip__key {
  min-width: 1.25rem;
  padding: 0.05rem 0.35rem;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.25);
  border-radius: 0.25rem;
  background: rgb(var(--v-theme-surface));
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}
</style>
