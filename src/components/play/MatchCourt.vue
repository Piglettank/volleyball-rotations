<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { createPlayerPositionAnimator } from '@/components/court/courtPlayerAnimation'
import { useMatchStore } from '@/stores/match'
import { useProfileStore } from '@/stores/profile'
import { getBallPlacement } from '@/lib/ballPlacement'
import {
  formationIdForTeam,
  getFormationCoordinates,
  lineupForRotation,
  ROLE_DISPLAY,
} from '@/lib/matchRotation'
import { learnToPlaySvgCoord, getPlayCourtSvg } from '@/lib/courtPlayLayout'
import { physicalCourtSide } from '@/models/match'
import {
  PLAY_BALL_RADIUS,
  PLAY_MARKER_FONT,
  PLAY_MARKER_RADIUS,
  PLAY_MARKER_STROKE_PX,
  PLAY_TEAM_COLORS,
} from '@/lib/playCourtMarkers'
import { APP_THEME_COLORS } from '@/styles/theme'
import PlayCourtSurface from '@/components/play/PlayCourtSurface.vue'
import { usePlayCourtOrientation } from '@/composables/usePlayCourtOrientation'
import { abbreviationFromName } from '@/models/profile'
import type { PlayerModel } from '@/models/player'
import type { TeamSide } from '@/models/match'

type AnimPlayer = PlayerModel & {
  team: TeamSide
  roleId: string
  roleName: string
  tooltip: string
}

type CourtMarker = {
  team: TeamSide
  roleId: string
  roleName: string
  label: string
  tooltip: string
  x: number
  y: number
}

const emit = defineEmits<{
  'player-click': [
    { team: TeamSide; roleId: string; roleName: string; screenX: number; screenY: number },
  ]
}>()

const matchStore = useMatchStore()
const profileStore = useProfileStore()
const svgRef = ref<SVGSVGElement | null>(null)
const courtRef = ref<HTMLDivElement | null>(null)
const animFrame = ref(0)
const hoveredMarkerKey = ref<string | null>(null)

const orientation = usePlayCourtOrientation()

const courtSvg = computed(() => getPlayCourtSvg(orientation.value))

// ── Pan / zoom ─────────────────────────────────────────────────────────────

const MIN_SCALE = 1
const MAX_SCALE = 8

const viewState = ref({ minX: 0, minY: 0, scale: 1 })

const viewBox = computed(() => {
  const svg = courtSvg.value
  const w = svg.viewWidth / viewState.value.scale
  const h = svg.viewHeight / viewState.value.scale
  return `${viewState.value.minX} ${viewState.value.minY} ${w} ${h}`
})

function clampViewState(s: { minX: number; minY: number; scale: number }) {
  const svg = courtSvg.value
  const scale = Math.min(Math.max(s.scale, MIN_SCALE), MAX_SCALE)
  const w = svg.viewWidth / scale
  const h = svg.viewHeight / scale
  return {
    scale,
    minX: Math.min(Math.max(s.minX, 0), svg.viewWidth - w),
    minY: Math.min(Math.max(s.minY, 0), svg.viewHeight - h),
  }
}

function resetView() {
  viewState.value = { minX: 0, minY: 0, scale: 1 }
}

// Reset when orientation changes so we don't end up with a stale viewport
watch(orientation, resetView)

function applyZoom(newScale: number, screenFocalX: number, screenFocalY: number) {
  const el = svgRef.value
  if (!el) return
  const ctm = el.getScreenCTM()
  if (!ctm) return

  // Convert focal screen point to SVG user coords (accounts for current viewBox)
  const pt = el.createSVGPoint()
  pt.x = screenFocalX
  pt.y = screenFocalY
  const focal = pt.matrixTransform(ctm.inverse())

  const oldScale = viewState.value.scale
  const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE)
  const factor = clampedScale / oldScale

  viewState.value = clampViewState({
    scale: clampedScale,
    minX: focal.x - (focal.x - viewState.value.minX) / factor,
    minY: focal.y - (focal.y - viewState.value.minY) / factor,
  })
}

// Non-passive wheel handler added in onMounted
function onCourtWheel(e: WheelEvent) {
  e.preventDefault()
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
  applyZoom(viewState.value.scale * factor, e.clientX, e.clientY)
}

// ── Pointer drag / pinch ───────────────────────────────────────────────────

const activePointers = new Map<number, { x: number; y: number }>()
// Non-reactive flag — read synchronously in click handlers
let dragMoved = false

function onCourtPointerDown(e: PointerEvent) {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  // Reset drag flag only when the first pointer goes down
  if (activePointers.size === 1) dragMoved = false
}

function onCourtPointerMove(e: PointerEvent) {
  if (!activePointers.has(e.pointerId)) return

  const prev = activePointers.get(e.pointerId)!
  const curr = { x: e.clientX, y: e.clientY }
  const dx = curr.x - prev.x
  const dy = curr.y - prev.y

  // Mark as drag once threshold is exceeded and capture pointer
  if (!dragMoved && Math.hypot(dx, dy) > 4) {
    dragMoved = true
    ;(e.currentTarget as HTMLElement)?.setPointerCapture(e.pointerId)
  }

  if (activePointers.size >= 2) {
    // Pinch zoom + implicit pan via focal midpoint
    const entries = [...activePointers.entries()]
    const [id0, pos0] = entries[0]!
    const [id1, pos1] = entries[1]!
    const c0 = id0 === e.pointerId ? curr : pos0
    const c1 = id1 === e.pointerId ? curr : pos1

    const prevDist = Math.hypot(pos0.x - pos1.x, pos0.y - pos1.y)
    const currDist = Math.hypot(c0.x - c1.x, c0.y - c1.y)

    if (prevDist > 0 && currDist > 0) {
      const midX = (c0.x + c1.x) / 2
      const midY = (c0.y + c1.y) / 2
      applyZoom(viewState.value.scale * (currDist / prevDist), midX, midY)
    }
  } else if (dragMoved) {
    // Single-pointer pan: convert screen delta to SVG user-space delta
    const el = svgRef.value
    if (el) {
      const ctm = el.getScreenCTM()
      if (ctm) {
        const inv = ctm.inverse()
        const p0 = el.createSVGPoint()
        const p1 = el.createSVGPoint()
        p0.x = 0; p0.y = 0
        p1.x = dx; p1.y = dy
        const s0 = p0.matrixTransform(inv)
        const s1 = p1.matrixTransform(inv)
        viewState.value = clampViewState({
          ...viewState.value,
          minX: viewState.value.minX - (s1.x - s0.x),
          minY: viewState.value.minY - (s1.y - s0.y),
        })
      }
    }
  }

  activePointers.set(e.pointerId, curr)
}

function onCourtPointerUp(e: PointerEvent) {
  activePointers.delete(e.pointerId)
  // Delay reset until after click handlers have had a chance to check dragMoved
  if (activePointers.size === 0) {
    setTimeout(() => { dragMoved = false }, 0)
  }
}

// ── Small-screen marker scaling ────────────────────────────────────────────

const isSmallScreen = ref(
  typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches,
)

const markerScale = computed(() => (isSmallScreen.value ? 1.5 : 1))
const markerRadius = computed(() => PLAY_MARKER_RADIUS * markerScale.value)
const markerFont = computed(() => PLAY_MARKER_FONT * markerScale.value)
const ballRadius = computed(() => PLAY_BALL_RADIUS * markerScale.value)

// ── Player animation ───────────────────────────────────────────────────────

const playerAnimator = createPlayerPositionAnimator(450)

function svgUserToScreenPoint(svgX: number, svgY: number): { x: number; y: number } | null {
  const svgEl = svgRef.value
  if (!svgEl) return null

  const point = svgEl.createSVGPoint()
  point.x = svgX
  point.y = svgY
  const ctm = svgEl.getScreenCTM()
  if (!ctm) return null

  const screen = point.matrixTransform(ctm)
  return { x: screen.x, y: screen.y }
}

function svgUserToContainerPoint(svgX: number, svgY: number): { x: number; y: number } | null {
  const container = courtRef.value
  const screen = svgUserToScreenPoint(svgX, svgY)
  if (!screen || !container) return null

  const containerRect = container.getBoundingClientRect()
  return {
    x: screen.x - containerRect.left,
    y: screen.y - containerRect.top,
  }
}

function markerId(team: TeamSide, roleId: string): string {
  return `${team}:${roleId}`
}

const formationKey = computed(() => {
  const s = matchStore.state
  if (!s) return ''
  return `${s.homeRotation}:${s.awayRotation}:${s.servingTeam}:${s.currentSet}:${s.sidesSwapped}:${orientation.value}`
})

function buildAnimPlayers(): AnimPlayer[] {
  const s = matchStore.state
  if (!s) return []

  const players: AnimPlayer[] = []

  for (const team of ['home', 'away'] as const) {
    const rotation = team === 'home' ? s.homeRotation : s.awayRotation
    const formationId = formationIdForTeam(rotation, s.servingTeam, team)
    const coords = getFormationCoordinates(formationId)
    const lineup = lineupForRotation(formationId)
    const assignments = team === 'home' ? s.homeAssignments : s.awayAssignments

    for (const roleId of lineup) {
      const learnCoord = coords[roleId] ?? { x: 0.5, y: 0.75 }
      const assigned = assignments[roleId] ?? null
      const profilePlayer = assigned ? profileStore.getPlayerById(assigned) : null
      const role = ROLE_DISPLAY[roleId] ?? { name: roleId, abbr: '?' }
      const label = profilePlayer ? abbreviationFromName(profilePlayer.name) : role.abbr
      const tooltip = profilePlayer ? `${profilePlayer.name} (${role.name})` : role.name

      players.push({
        id: markerId(team, roleId),
        name: label,
        abbreviation: label,
        coordinate: { ...learnCoord },
        team,
        roleId,
        roleName: role.name,
        tooltip,
      })
    }
  }

  return players
}

const animPlayers = computed(() => buildAnimPlayers())

function toCourtMarker(player: AnimPlayer): CourtMarker {
  const s = matchStore.state!
  const courtSide = physicalCourtSide(player.team, s.sidesSwapped)
  const { x, y } = learnToPlaySvgCoord(player.coordinate, courtSide, orientation.value)
  return {
    team: player.team,
    roleId: player.roleId,
    roleName: player.roleName,
    label: player.abbreviation,
    tooltip: player.tooltip,
    x,
    y,
  }
}

const homeMarkers = computed(() => {
  animFrame.value
  return playerAnimator
    .getDisplayPlayers(animPlayers.value)
    .map((player) => toCourtMarker(player as AnimPlayer))
    .filter((marker) => marker.team === 'home')
})

const awayMarkers = computed(() => {
  animFrame.value
  return playerAnimator
    .getDisplayPlayers(animPlayers.value)
    .map((player) => toCourtMarker(player as AnimPlayer))
    .filter((marker) => marker.team === 'away')
})

const activeTooltipMarker = computed(() => {
  if (!hoveredMarkerKey.value) return null
  const markers = [...homeMarkers.value, ...awayMarkers.value]
  return (
    markers.find((marker) => markerId(marker.team, marker.roleId) === hoveredMarkerKey.value) ??
    null
  )
})

const tooltipStyle = computed(() => {
  const marker = activeTooltipMarker.value
  if (!marker) return undefined

  const center = svgUserToContainerPoint(marker.x, marker.y)
  const above = svgUserToContainerPoint(marker.x, marker.y - markerRadius.value)
  if (!center || !above) return undefined

  const markerRadiusPx = center.y - above.y

  return {
    left: `${center.x}px`,
    top: `${center.y}px`,
    transform: `translate(-50%, calc(-100% - ${markerRadiusPx}px - 0.35rem))`,
  }
})

function showTooltip(marker: CourtMarker) {
  hoveredMarkerKey.value = markerId(marker.team, marker.roleId)
}

function hideTooltip(marker: CourtMarker) {
  if (hoveredMarkerKey.value === markerId(marker.team, marker.roleId)) {
    hoveredMarkerKey.value = null
  }
}

const ballPosition = computed(() => {
  const s = matchStore.state
  if (!s) return null

  const team = s.servingTeam
  const rotation = team === 'home' ? s.homeRotation : s.awayRotation
  const formationId = formationIdForTeam(rotation, s.servingTeam, team)
  const placement = getBallPlacement(formationId)
  if (!placement) return null

  return learnToPlaySvgCoord(
    placement.normalized,
    physicalCourtSide(team, s.sidesSwapped),
    orientation.value,
  )
})

function onPlayerClick(marker: CourtMarker, _event: MouseEvent) {
  // Suppress clicks that were part of a drag gesture
  if (dragMoved) return

  const screen = svgUserToScreenPoint(marker.x, marker.y)
  if (!screen) return

  emit('player-click', {
    team: marker.team,
    roleId: marker.roleId,
    roleName: marker.roleName,
    screenX: screen.x,
    screenY: screen.y,
  })
}

function onCourtDoubleClick(e: MouseEvent) {
  // Double-clicking a marker opens the assign popover — don't reset view
  if ((e.target as Element).closest('.match-court__player')) return
  resetView()
}

watch(formationKey, () => {
  playerAnimator.animate(animPlayers.value, () => {
    animFrame.value += 1
  })
})

onMounted(() => {
  playerAnimator.setImmediate(animPlayers.value)

  // Small-screen listener
  const mq = window.matchMedia('(max-width: 640px)')
  const mqHandler = (e: MediaQueryListEvent) => { isSmallScreen.value = e.matches }
  mq.addEventListener('change', mqHandler)

  // Non-passive wheel listener so we can call preventDefault()
  const courtEl = courtRef.value
  courtEl?.addEventListener('wheel', onCourtWheel, { passive: false })

  onUnmounted(() => {
    mq.removeEventListener('change', mqHandler)
    courtEl?.removeEventListener('wheel', onCourtWheel)
  })
})

onUnmounted(() => {
  playerAnimator.cancel()
})
</script>

<template>
  <div
    ref="courtRef"
    class="match-court"
    :class="{ 'match-court--zoomed': viewState.scale > 1 }"
    @pointerdown="onCourtPointerDown"
    @pointermove="onCourtPointerMove"
    @pointerup="onCourtPointerUp"
    @pointercancel="onCourtPointerUp"
    @dblclick="onCourtDoubleClick"
  >
    <svg
      ref="svgRef"
      :viewBox="viewBox"
      class="match-court__svg"
      :aria-label="`Play court — ${matchStore.state?.config.homeTeamName} vs ${matchStore.state?.config.awayTeamName}`"
    >
      <PlayCourtSurface :orientation="orientation" />

      <g v-for="marker in homeMarkers" :key="`home-${marker.roleId}`">
        <circle
          :cx="marker.x"
          :cy="marker.y"
          :r="markerRadius"
          :fill="PLAY_TEAM_COLORS.home.fill"
          :stroke="PLAY_TEAM_COLORS.home.stroke"
          :stroke-width="PLAY_MARKER_STROKE_PX"
          vector-effect="non-scaling-stroke"
          class="match-court__player"
          @click="onPlayerClick(marker, $event)"
          @mouseenter="showTooltip(marker)"
          @mouseleave="hideTooltip(marker)"
        />
        <text
          :x="marker.x"
          :y="marker.y"
          :font-size="markerFont"
          fill="#ffffff"
          font-weight="700"
          text-anchor="middle"
          dominant-baseline="central"
          alignment-baseline="central"
          pointer-events="none"
        >
          {{ marker.label }}
        </text>
      </g>

      <g v-for="marker in awayMarkers" :key="`away-${marker.roleId}`">
        <circle
          :cx="marker.x"
          :cy="marker.y"
          :r="markerRadius"
          :fill="PLAY_TEAM_COLORS.away.fill"
          :stroke="PLAY_TEAM_COLORS.away.stroke"
          :stroke-width="PLAY_MARKER_STROKE_PX"
          vector-effect="non-scaling-stroke"
          class="match-court__player"
          @click="onPlayerClick(marker, $event)"
          @mouseenter="showTooltip(marker)"
          @mouseleave="hideTooltip(marker)"
        />
        <text
          :x="marker.x"
          :y="marker.y"
          :font-size="markerFont"
          fill="#ffffff"
          font-weight="700"
          text-anchor="middle"
          dominant-baseline="central"
          alignment-baseline="central"
          pointer-events="none"
        >
          {{ marker.label }}
        </text>
      </g>

      <g v-if="ballPosition">
        <circle
          :cx="ballPosition.x"
          :cy="ballPosition.y"
          :r="ballRadius"
          fill="#ffffff"
          :stroke="APP_THEME_COLORS.primary"
          :stroke-width="PLAY_MARKER_STROKE_PX"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </svg>

    <div
      v-if="activeTooltipMarker"
      class="match-court__tooltip"
      :style="tooltipStyle"
      role="tooltip"
    >
      {{ activeTooltipMarker.tooltip }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.match-court {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  touch-action: none;
  user-select: none;

  &--zoomed {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

.match-court__tooltip {
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

.match-court__svg {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.match-court__player {
  cursor: pointer;
  transition: opacity 0.1s;

  &:hover {
    opacity: 0.85;
  }
}
</style>
